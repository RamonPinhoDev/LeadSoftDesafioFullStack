using LeadSoftDesafio.Aplication.DTOs;
using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace LeadSoftDesafio.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComentarioController : ControllerBase
    {
        private readonly IComentarioService _comentarioService;
        public ComentarioController(IComentarioService comentarioService)
        {
            _comentarioService = comentarioService;
        }
        [HttpGet]
        public ActionResult<IEnumerable<ComentarioDTO>> Get([FromQuery] string MediaId)
        {
            try
            {
                var comentarios = _comentarioService.GetComentariosByMediaIdService(MediaId);
                var comentariosDTO = comentarios.Select(c => new ComentarioDTO
                {
                    ComentarioId = c.ComentarioId,
                    MediaId = c.MediaId,
                    Coment = c.Coment,
                    DataCriacao = c.DataCriacao
                }).ToList();

                return Ok(comentariosDTO);
            }
            catch (Raven.Client.Exceptions.RavenException e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro ao acessar arquivo", Detail = e.Message });
            }
            catch (Exception e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro inesperado", Detail = e.Message });
            }
        }


        [HttpPost]
        public IActionResult Post([FromBody] ComentarioCadastroDTO comentarioDTO)
        {
            try
            {
                _comentarioService.CreateComentarioService(new Comentario
                {
                    MediaId = comentarioDTO.MediaId,
                    Coment = comentarioDTO.Coment,

                });
                return Ok(new { message = "Comentário criado com sucesso." });
            }
            catch (Raven.Client.Exceptions.RavenException e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro ao acessar arquivo", Detail = e.Message });
            }
            catch (Exception e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro inesperado", Detail = e.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            try
            {
                _comentarioService.DeleteComentarioService(id);
                return Ok(new { message = "Comentário excluído com sucesso." });
            }
            catch (Raven.Client.Exceptions.RavenException e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro ao acessar arquivo", Detail = e.Message });
            }
            catch (Exception e)
            {
                return BadRequest(new ProblemDetails { Title = "Erro inesperado", Detail = e.Message });
            }
        }
    }
}
