using LeadSoftDesafio.Aplication.DTOs;
using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Aplication.Services;

public class ComentarioService : IComentarioService
{
    private readonly IComentarioRepository _comentarioRepository;
    public ComentarioService(IComentarioRepository comentarioRepository)
    {
        _comentarioRepository = comentarioRepository;
    }

    public void CreateComentarioService(Comentario comentario)
    {
        comentario.ComentarioId = Guid.NewGuid().ToString();
        comentario.DataCriacao = DateTime.Now;
    
        _comentarioRepository.CreateComentario(comentario);
    }

  

    public void DeleteComentarioService(string comentarioId)
    {
        _comentarioRepository.DeleteComentario(comentarioId);
    }

    public List<Comentario> GetComentariosByMediaIdService(string mediaId)
    {
        var comentarios = _comentarioRepository.GetComentariosByMediaId(mediaId);
        return comentarios;
    }
    

}
