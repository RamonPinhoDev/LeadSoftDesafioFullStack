using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Aplication.DTOs
{
    public class UsuarioDTO
    {
        public string Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string? Cpf { get; set; }
        public DateTime DataNascimento { get; set; }


    }
}
