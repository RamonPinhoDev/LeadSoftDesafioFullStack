using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Aplication.DTOs
{
    public class ComentarioDTO
    {
        public string? ComentarioId { get; set; }
        public string? MediaId { get; set; }
        public string? Coment { get; set; }

        public DateTime DataCriacao { get; set; }


    }
}
