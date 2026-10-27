using LeadSoftDesafio.Aplication.DTOs;
using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Net;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace LeadSoftDesafio.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IConfiguration _config;
        public UsuariosController(IUsuarioService usuarioService, IConfiguration config)
        {
            _usuarioService = usuarioService;
            _config = config;
        }

        [HttpGet("[Action]")]
        public ActionResult<IEnumerable<UsuarioDTO>> Get()
        {
            try {
                var usuarios = _usuarioService.ObterUsuariosService();
                var usuariosDTO = new List<UsuarioDTO>();

                foreach (var usuario in usuarios)
                {
                    var usuarioDTO = new UsuarioDTO
                    {
                        Id = usuario.Id,
                        Nome = usuario.Nome,
                        Email = usuario.Email,
                        DataNascimento = usuario.DataNascimento.Value
                    };
                    usuariosDTO.Add(usuarioDTO);
                }
                return Ok(usuariosDTO);
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

        [HttpGet("[Action]/{id}")]
        public ActionResult<UsuarioDTO> Get(string id)
        { try {
                var usuario = _usuarioService.ObterUsuarioPorIdService(id);
                var usuarioDTO = new UsuarioDTO
                {
                    Id = usuario.Id,
                    Nome = usuario.Nome,
                    Email = usuario.Email,
                    DataNascimento = usuario.DataNascimento.Value,
                    Cpf = usuario.Cpf
                };

                return Ok(usuarioDTO);
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

        [HttpPost("[Action]")]
        public IActionResult Post([FromBody] UsuarioCadatroDTO usuarioDTO)
        {
            try {
                _usuarioService.AdicionarUsuarioService(new Usuario
                {
                    Nome = usuarioDTO.Nome,
                    Email = usuarioDTO.Email,
                    DataNascimento = usuarioDTO.DataNascimento,
                    Senha = usuarioDTO.Senha,
                    Cpf = usuarioDTO.Cpf
                });

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

        [HttpPut("[Action]")]
        public IActionResult Put([FromBody] UsuarioDTO usuarioDTO)
        {
            try
            {
                var usuario = _usuarioService.ObterUsuarioPorIdService(usuarioDTO.Id);
                usuario.Nome = usuarioDTO.Nome;
                usuario.Email = usuarioDTO.Email;
                usuario.DataNascimento = usuarioDTO.DataNascimento;
                _usuarioService.AtualizarUsuarioService(usuario);

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
            [HttpDelete("[Action]/{id}")]
            public IActionResult Delete(string id)
            {
                try
                {
                    _usuarioService.ExcluirUsuarioService(id.ToString());
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

        [HttpPost("[Action]")]
        public IActionResult Login(UsuarioCadatroDTO usuarioDTO)
        {
            try
            {
             var usuario =   _usuarioService.loginService(usuarioDTO.Email, usuarioDTO.Senha);

                return Ok(usuario);
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


        [HttpGet("[Action]")]
        public  bool ReCaptchaPassed(string gRecaptchaResponse)
        {
            HttpClient httpClient = new HttpClient();

            var res = httpClient.GetAsync($"https://www.google.com/recaptcha/api/siteverify?secret={_config["Recaptcha:SecretKey"]}&response={gRecaptchaResponse}").Result;

            if (res.StatusCode != HttpStatusCode.OK)
            {
                return false;
            }
            string JSONres = res.Content.ReadAsStringAsync().Result;
            dynamic JSONdata = JObject.Parse(JSONres);

            if (JSONdata.success != "true" || JSONdata.score <= 0.5m)
            {
                return false;
            }

            return true;
        }
    }

    }
