using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Entities
{
    public class Usuario
    {
        public string? Id { get; set; }
        public string? Nome { get; set; }
        public string? Email { get; set; }

        public string? Cpf { get; set; }
        public string? Senha { get; set; }
        public DateTime? DataNascimento { get; set; }


    }
}
