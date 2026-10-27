using LeadSoftDesafio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IComentarioService
    {
        public void CreateComentarioService(Comentario comentario);
        public List<Comentario> GetComentariosByMediaIdService(string mediaId);
        public void DeleteComentarioService(string comentarioId);
    }
}
