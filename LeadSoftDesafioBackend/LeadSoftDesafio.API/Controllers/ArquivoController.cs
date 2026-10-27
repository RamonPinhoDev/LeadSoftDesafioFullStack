using LeadSoftDesafio.Domain.Exceptions;
using LeadSoftDesafio.Domain.Ports;
using LeadSoftDesafio.Domain.ValuesObjects;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace LeadSoftDesafio.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArquivoController : ControllerBase
    {
        private readonly IAnexacaoArquivoService _anexacaoArquivoService;

        public ArquivoController(IAnexacaoArquivoService anexacaoArquivoService)
        {
            _anexacaoArquivoService = anexacaoArquivoService;
        }

        // GET api/<ArquivoController>/5
        [HttpGet("[action]/{id}")]
        public ActionResult< IEnumerable<MediaResponse>> BuscarArquivoService(string id)
        {
            try
            {
                var media = _anexacaoArquivoService.BuscarArquivoService(id);
                return Ok(media);
            }
            catch (MediaTypeExcption e)
            {
                return BadRequest(new ProblemDetails { Title = "Formato de arquivo inválido", Detail = e.Message });
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
        
        [HttpPost("[action]")]
        public IActionResult AnexarArquivoService(IFormFile Imagem, [FromQuery]  string IdUsuario, [FromQuery] string ImagemLgenda)
        {
            try { 
            _anexacaoArquivoService.AnexarArquivoService(Imagem, IdUsuario, ImagemLgenda);
            return Ok();
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
