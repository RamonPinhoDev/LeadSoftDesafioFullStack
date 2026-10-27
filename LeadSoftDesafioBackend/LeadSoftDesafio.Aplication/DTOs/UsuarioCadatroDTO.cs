using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Aplication.DTOs
{
    public class UsuarioCadatroDTO
    {
       
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }
        public string? Cpf { get; set; }
        public DateTime DataNascimento { get; set; }
    }
}
