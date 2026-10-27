using LeadSoftDesafio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IComentarioRepository
    {
        public void  CreateComentario(Comentario comentario);
        public List<Comentario> GetComentariosByMediaId(string mediaId);
        public void DeleteComentario(string comentarioId);
    }
}
