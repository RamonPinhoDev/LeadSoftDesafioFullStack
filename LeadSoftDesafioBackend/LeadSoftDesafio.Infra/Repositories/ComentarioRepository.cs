using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using Raven.Client.Documents;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Infra.Repositories;

public class ComentarioRepository : IComentarioRepository
{private readonly IDocumentStore _documentStore;

    public ComentarioRepository(IDocumentStore documentStore)
    {
        _documentStore = documentStore;
    }

    public void CreateComentario(Comentario comentario)
    {
        using (var session = _documentStore.OpenSession())
        {
            session.Store(comentario);
            session.SaveChanges();
        }

    }

    public void DeleteComentario(string comentarioId)
    {
        using (var session = _documentStore.OpenSession())
        {
            var comentario = session.Load<Comentario>(comentarioId);
            if (comentario != null)
            {
                session.Delete(comentario);
                session.SaveChanges();
            }
        }
    }

    public List<Comentario> GetComentariosByMediaId(string mediaId)
    {
        using (var session = _documentStore.OpenSession())
        {
            return session.Query<Comentario>()
                .Where(c => c.MediaId == mediaId)
                .ToList();
        }
    }



    }


