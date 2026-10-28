package com.codegol.api.modules.auth.dto;
import com.codegol.api.modules.auth.model.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RegisterRequest {
	

	    public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getNombreCompleto() {
		return nombreCompleto;
	}

	public void setNombreCompleto(String nombreCompleto) {
		this.nombreCompleto = nombreCompleto;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Rol getRol() {
		return rol;
	}

	public void setRol(Rol rol) {
		this.rol = rol;
	}

		@NotBlank(message = "El nombre de usuario es obligatorio")
	    @Size(min = 4, max = 50, message = "El usuario debe tener entre 4 y 50 caracteres")
	    private String username;

	    @NotBlank(message = "La contraseña es obligatoria")
	    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
	    private String password;

	    @NotBlank(message = "El nombre completo es obligatorio")
	    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
	    private String nombreCompleto;

	    @NotBlank(message = "El correo electrónico es obligatorio")
	    @Email(message = "Debe proporcionar un correo electrónico válido")
	    private String email;

	    @NotNull(message = "El rol es obligatorio")
	    private Rol rol;
	}

