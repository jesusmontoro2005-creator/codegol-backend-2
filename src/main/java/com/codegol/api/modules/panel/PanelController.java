package com.codegol.api.modules.panel;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** JDBC endpoints used by the remaining React panel modules. */
@RestController
@RequestMapping("/api")
public class PanelController {
    private final JdbcTemplate jdbc;

    public PanelController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/partidos/{id}/cedula")
    public Map<String,Object> cedula(@PathVariable Long id) {
        Map<String,Object> partido=partido(id);
        List<Map<String,Object>> pases=jdbc.queryForList("SELECT pl.partido_id AS partidoId,pl.jugador_id AS jugadorId,pl.equipo_id AS equipoId,pl.resultado,pl.metodo,pl.tiempo_ms AS tiempoMs,CONCAT_WS(' ',j.nombre,j.apellido_paterno,j.apellido_materno) AS jugador,j.numero_camiseta AS dorsal,j.foto_url AS fotoUrl,e.nombre AS equipo FROM pase_lista pl JOIN jugadores j ON j.id=pl.jugador_id JOIN equipos e ON e.id=pl.equipo_id WHERE pl.partido_id=?",id);
        List<Map<String,Object>> eventos=jdbc.queryForList("SELECT ev.id,ev.partido_id AS partidoId,ev.equipo_id AS equipoId,ev.jugador_id AS jugadorId,ev.tipo,ev.minuto,CONCAT_WS(' ',j.nombre,j.apellido_paterno,j.apellido_materno) AS jugador,j.numero_camiseta AS dorsal,e.nombre AS equipo FROM eventos_partido ev JOIN jugadores j ON j.id=ev.jugador_id JOIN equipos e ON e.id=ev.equipo_id WHERE ev.partido_id=? ORDER BY ev.minuto,ev.id",id);
        List<Map<String,Object>> plantillas=jdbc.queryForList("SELECT j.id AS jugadorId, j.equipo_id AS equipoId,e.nombre AS equipo,CONCAT_WS(' ',j.nombre,j.apellido_paterno,j.apellido_materno) AS jugador,j.numero_camiseta AS dorsal,EXISTS(SELECT 1 FROM huellas_biometricas h WHERE h.jugador_id=j.id AND h.motor='SOURCEAFIS') AS huella,EXISTS(SELECT 1 FROM suspensiones s WHERE s.jugador_id=j.id AND s.torneo_id=? AND s.activa=1) AS suspendido FROM jugadores j JOIN equipos e ON e.id=j.equipo_id WHERE j.equipo_id IN (?,?) ORDER BY j.equipo_id,j.numero_camiseta", partido.get("torneoId"), partido.get("localId"), partido.get("visitanteId"));
        Map<String,List<Map<String,Object>>> porEquipo=new HashMap<>();
        for (Map<String,Object> j:plantillas) porEquipo.computeIfAbsent(String.valueOf(j.get("equipoId")),k->new ArrayList<>()).add(j);
        List<Map<String,Object>> equipos=List.of(teamList(partido,"localId","local",porEquipo),teamList(partido,"visitanteId","visitante",porEquipo));
        return Map.of("partido",partido,"pases",pases,"eventos",eventos,"plantillas",equipos);
    }

    @GetMapping("/torneos/{torneoId}/posiciones")
    public List<Map<String,Object>> posiciones(@PathVariable Long torneoId) {
        var rows=jdbc.queryForList("SELECT e.id AS equipoId,e.nombre AS equipo,COUNT(p.id) AS pj,SUM(p.id IS NOT NULL AND IF(p.equipo_local_id=e.id,p.goles_local,p.goles_visitante)>IF(p.equipo_local_id=e.id,p.goles_visitante,p.goles_local)) AS pg,SUM(p.id IS NOT NULL AND p.goles_local=p.goles_visitante) AS pe,SUM(p.id IS NOT NULL AND IF(p.equipo_local_id=e.id,p.goles_local,p.goles_visitante)<IF(p.equipo_local_id=e.id,p.goles_visitante,p.goles_local)) AS pp,SUM(IF(p.equipo_local_id=e.id,p.goles_local,p.goles_visitante)) AS gf,SUM(IF(p.equipo_local_id=e.id,p.goles_visitante,p.goles_local)) AS gc FROM inscripciones i JOIN equipos e ON e.id=i.equipo_id LEFT JOIN jornadas j ON j.torneo_id=i.torneo_id LEFT JOIN partidos p ON p.jornada_id=j.id AND p.estado='FINALIZADO' AND e.id IN(p.equipo_local_id,p.equipo_visitante_id) WHERE i.torneo_id=? AND i.estado='ACTIVO' GROUP BY e.id,e.nombre",torneoId);
        for(var r:rows){int gf=num0(r.get("gf")),gc=num0(r.get("gc")),pg=num0(r.get("pg")),pe=num0(r.get("pe"));r.put("dg",gf-gc);r.put("pts",pg*3+pe);}
        rows.sort((a,b)->{int c=Integer.compare(num0(b.get("pts")),num0(a.get("pts")));if(c==0)c=Integer.compare(num0(b.get("dg")),num0(a.get("dg")));if(c==0)c=Integer.compare(num0(b.get("gf")),num0(a.get("gf")));return c;});
        for(int i=0;i<rows.size();i++) rows.get(i).put("posicion",i+1);
        return rows;
    }

    @GetMapping("/torneos/{torneoId}/goleadores")
    public List<Map<String,Object>> goleadores(@PathVariable Long torneoId) {
        var rows=jdbc.queryForList("SELECT j.id AS jugadorId,CONCAT_WS(' ',j.nombre,j.apellido_paterno,j.apellido_materno) AS jugador,e.nombre AS equipo,COUNT(*) AS goles FROM eventos_partido ev JOIN partidos p ON p.id=ev.partido_id JOIN jornadas jo ON jo.id=p.jornada_id JOIN jugadores j ON j.id=ev.jugador_id JOIN equipos e ON e.id=ev.equipo_id WHERE jo.torneo_id=? AND ev.tipo='GOL' GROUP BY j.id,j.nombre,j.apellido_paterno,j.apellido_materno,e.nombre ORDER BY goles DESC,jugador",torneoId);
        for(int i=0;i<rows.size();i++)rows.get(i).put("posicion",i+1);return rows;
    }

    @GetMapping("/torneos/{torneoId}/suspensiones")
    public List<Map<String,Object>> suspensiones(@PathVariable Long torneoId) {
        return jdbc.queryForList("SELECT s.jugador_id AS jugadorId,CONCAT_WS(' ',j.nombre,j.apellido_paterno,j.apellido_materno) AS jugador,e.nombre AS equipo,s.motivo,s.partidos_restantes AS partidosRestantes FROM suspensiones s JOIN jugadores j ON j.id=s.jugador_id JOIN equipos e ON e.id=j.equipo_id WHERE s.torneo_id=? AND s.activa=1 ORDER BY jugador",torneoId);
    }

    @GetMapping("/pagos")
    public List<Map<String,Object>> pagos(@RequestParam(required=false) String desde,@RequestParam(required=false) String hasta,@RequestParam(required=false) String concepto) {
        StringBuilder sql=new StringBuilder(pagoSql()).append(" WHERE pg.estado='CUBIERTO'");var args=new ArrayList<Object>();
        if(desde!=null&&!desde.isBlank()){sql.append(" AND pg.fecha_pago>=?");args.add(desde+" 00:00:00");}
        if(hasta!=null&&!hasta.isBlank()){sql.append(" AND pg.fecha_pago<=?");args.add(hasta+" 23:59:59");}
        if(concepto!=null&&!concepto.isBlank()){sql.append(" AND pg.concepto=?");args.add(concepto);}
        sql.append(" ORDER BY pg.fecha_pago DESC,pg.id DESC");return jdbc.queryForList(sql.toString(),args.toArray());
    }

    @PostMapping("/pagos")
    @Transactional
    public Map<String,Object> registrarPago(@RequestBody Map<String,Object> body) {
        String concepto=str(body,"concepto");long equipo=number(body,"equipoId");Long torneo=body.get("torneoId")==null?null:number(body,"torneoId");Long partido=body.get("partidoId")==null?null:number(body,"partidoId");
        java.math.BigDecimal monto=body.get("monto")==null?java.math.BigDecimal.ZERO:new java.math.BigDecimal(body.get("monto").toString());
        if("MULTA".equals(concepto)&&monto.signum()<=0||monto.signum()<0)throw bad("El monto del pago no es válido.");
        Long inscripcion=null;
        if("INSCRIPCION".equals(concepto)){var ids=jdbc.queryForList("SELECT id FROM inscripciones WHERE torneo_id=? AND equipo_id=?",Long.class,torneo,equipo);if(ids.isEmpty())throw bad("El equipo no está inscrito en este torneo.");inscripcion=ids.get(0);if(jdbc.queryForObject("SELECT COUNT(*) FROM inscripciones WHERE id=? AND estado='ACTIVO'",Integer.class,inscripcion)>0)throw conflict("La inscripción ya está pagada.");}
        if("ARBITRAJE".equals(concepto)){if(partido==null)throw bad("Elige el partido del arbitraje.");if(jdbc.queryForObject("SELECT COUNT(*) FROM pagos WHERE partido_id=? AND equipo_id=? AND concepto='ARBITRAJE' AND estado='CUBIERTO'",Integer.class,partido,equipo)>0)throw conflict("Ese equipo ya pagó el arbitraje de este partido.");}
        long id=insertar("INSERT INTO pagos(equipo_id,concepto,inscripcion_id,partido_id,descripcion,monto,metodo_pago,estado,fecha_pago,cobrado_por) VALUES(?,?,?,?,?,?,?,'CUBIERTO',NOW(),?)",equipo,concepto,inscripcion,partido,emptyNull(str(body,"descripcion")),monto,str(body,"metodo"),currentUserId());
        if(inscripcion!=null){jdbc.update("UPDATE inscripciones SET estado='ACTIVO' WHERE id=?",inscripcion);jdbc.update("UPDATE equipos SET pago_inscripcion_cubierto=1 WHERE id=?",equipo);}
        jdbc.update("INSERT INTO recibos(pago_id,folio) VALUES(?,?)",id,String.format("CG-%06d",id));
        return pago(id);
    }

    @GetMapping("/pagos/{id}") public Map<String,Object> recibo(@PathVariable Long id){return pago(id);}

    @GetMapping("/usuarios/arbitros")
    public List<Map<String,Object>> arbitros(){return jdbc.queryForList("SELECT id,username,nombre_completo AS nombreCompleto,email,rol FROM usuarios WHERE activo=1 AND rol='ROLE_ARBITRO' ORDER BY nombre_completo");}

    @GetMapping("/usuarios")
    public List<Map<String,Object>> usuarios(){return jdbc.queryForList("SELECT id,username,nombre_completo AS nombreCompleto,email,rol,activo FROM usuarios ORDER BY nombre_completo");}

    @PutMapping("/usuarios/{id}/rol")
    public Map<String,Object> cambiarRol(@PathVariable Long id,@RequestBody Map<String,Object> body){String rol=str(body,"rol");if(!List.of("ROLE_ADMIN","ROLE_ARBITRO","ROLE_MESA_CONTROL","ROLE_JUGADOR").contains(rol))throw bad("Rol no válido.");if(jdbc.update("UPDATE usuarios SET rol=? WHERE id=?",rol,id)==0)throw missing("Usuario",id);return jdbc.queryForMap("SELECT id,username,nombre_completo AS nombreCompleto,email,rol,activo FROM usuarios WHERE id=?",id);}

    private String partidoSql(){return "SELECT p.id,j.torneo_id AS torneoId,t.nombre AS torneo,j.id AS jornadaId,j.numero AS jornada,p.fecha,p.hora_inicio AS horaInicio,p.hora_fin AS horaFin,p.cancha_id AS canchaId,ca.nombre AS cancha,p.equipo_local_id AS localId,el.nombre AS local,p.equipo_visitante_id AS visitanteId,ev.nombre AS visitante,p.goles_local AS golesLocal,p.goles_visitante AS golesVisitante,p.estado,p.arbitro_id AS arbitroId,u.nombre_completo AS arbitro,(SELECT COUNT(DISTINCT pg.equipo_id) FROM pagos pg WHERE pg.partido_id=p.id AND pg.concepto='ARBITRAJE' AND pg.estado='CUBIERTO') AS equiposPagados,((SELECT COUNT(DISTINCT pg.equipo_id) FROM pagos pg WHERE pg.partido_id=p.id AND pg.concepto='ARBITRAJE' AND pg.estado='CUBIERTO')>=2) AS arbitrajeCubierto FROM partidos p JOIN jornadas j ON j.id=p.jornada_id JOIN torneos t ON t.id=j.torneo_id JOIN canchas ca ON ca.id=p.cancha_id JOIN equipos el ON el.id=p.equipo_local_id JOIN equipos ev ON ev.id=p.equipo_visitante_id LEFT JOIN usuarios u ON u.id=p.arbitro_id";}
    private String pagoSql(){return "SELECT pg.id,pg.equipo_id AS equipoId,e.nombre AS equipo,pg.concepto,pg.partido_id AS partidoId,pg.monto,pg.metodo_pago AS metodo,pg.estado,pg.fecha_pago AS fechaPago,pg.descripcion,r.folio,j.torneo_id AS torneoId,t.nombre AS torneo FROM pagos pg JOIN equipos e ON e.id=pg.equipo_id LEFT JOIN recibos r ON r.pago_id=pg.id LEFT JOIN partidos p ON p.id=pg.partido_id LEFT JOIN jornadas j ON j.id=p.jornada_id LEFT JOIN torneos t ON t.id=COALESCE(j.torneo_id,(SELECT i.torneo_id FROM inscripciones i WHERE i.id=pg.inscripcion_id))";}
    private Map<String,Object> partido(long id){try{return jdbc.queryForMap(partidoSql()+" WHERE p.id=?",id);}catch(org.springframework.dao.EmptyResultDataAccessException ex){throw missing("Partido",id);}}
    private Map<String,Object> pago(long id){try{return jdbc.queryForMap(pagoSql()+" WHERE pg.id=?",id);}catch(org.springframework.dao.EmptyResultDataAccessException ex){throw missing("Pago",id);}}
    private long jornada(long torneo,int numero){var found=jdbc.queryForList("SELECT id FROM jornadas WHERE torneo_id=? AND numero=?",Long.class,torneo,numero);if(!found.isEmpty())return found.get(0);return insertar("INSERT INTO jornadas(torneo_id,numero) VALUES(?,?)",torneo,numero);}
    private boolean pagado(long torneo,long equipo){return jdbc.queryForObject("SELECT COUNT(*) FROM inscripciones WHERE torneo_id=? AND equipo_id=? AND estado='ACTIVO'",Integer.class,torneo,equipo)>0;}
    private long insertar(String sql,Object...args){KeyHolder holder=new GeneratedKeyHolder();jdbc.update(c->{PreparedStatement ps=c.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS);for(int i=0;i<args.length;i++)ps.setObject(i+1,args[i]);return ps;},holder);Number key=holder.getKey();if(key==null)throw new IllegalStateException("La base no devolvió el ID del registro.");return key.longValue();}
    private Map<String,Object> teamList(Map<String,Object> partido,String idKey,String nameKey,Map<String,List<Map<String,Object>>> lists){Long id=((Number)partido.get(idKey)).longValue();Map<String,Object> group=new HashMap<>();group.put("equipoId",id);group.put("equipo",partido.get(nameKey));group.put("jugadores",lists.getOrDefault(String.valueOf(id),List.of()));return group;}
    private long currentUserId(){String user=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();return jdbc.queryForObject("SELECT id FROM usuarios WHERE username=?",Long.class,user);}
    private static String str(Map<String,Object> m,String k){Object v=m.get(k);return v==null?"":v.toString();}
    private static long number(Map<String,Object> m,String k){Object v=m.get(k);try{return v instanceof Number n?n.longValue():Long.parseLong(String.valueOf(v));}catch(Exception ex){throw bad("Falta un valor numérico válido: "+k);}}
    private static int num0(Object v){return v instanceof Number n?n.intValue():0;}
    private static String emptyNull(String s){return s==null||s.isBlank()?null:s;}
    private static List<Long> longs(Object v){if(!(v instanceof List<?> l))return List.of();var out=new ArrayList<Long>();for(Object x:l)if(x instanceof Number n)out.add(n.longValue());return out;}
    private static List<String> strings(Object v){if(!(v instanceof List<?> l))return List.of();return l.stream().map(Object::toString).toList();}
    private static ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
    private static ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
    private static ResponseStatusException missing(String what,Object id){return new ResponseStatusException(HttpStatus.NOT_FOUND,what+" no encontrado: "+id);}
}
