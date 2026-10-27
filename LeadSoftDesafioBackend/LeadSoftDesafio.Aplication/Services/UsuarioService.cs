using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace LeadSoftDesafio.Aplication.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _usuarioRepository;


        public UsuarioService(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }
        public void AdicionarUsuarioService(Usuario usuario)
        {
            usuario.Id = Guid.NewGuid().ToString();
            usuario.Senha = criaHash(usuario.Senha);
            _usuarioRepository.AdicionarUsuario(usuario);
        }

        public void AtualizarUsuarioService(Usuario usuario)
        {
            usuario.Senha = criaHash(usuario.Senha);
            _usuarioRepository.AtualizarUsuario(usuario);
        }

        public void ExcluirUsuarioService(string id)
        {
            _usuarioRepository.ExcluirUsuario(id);
        }

        public Usuario ObterUsuarioPorEmailService(string email)
        {
            var usuario = _usuarioRepository.ObterUsuarioPorEmail(email);
            return usuario;
        }

        public Usuario ObterUsuarioPorIdService(string id)
        {
            var usuario = _usuarioRepository.ObterUsuarioPorId(id);
            return usuario;
        }

        public IEnumerable<Usuario> ObterUsuariosService()
        {
            var usuarios = _usuarioRepository.ObterUsuarios();
            return usuarios;
        }




        public string criaHash(string texto)
        {
            var md5 = MD5.Create();
            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(texto);
            byte[] hash = md5.ComputeHash(bytes);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("X2"));
            }

            return sb.ToString();
        }

        public Usuario loginService(string email, string senha)
        {
           
            senha = criaHash(senha);
            var usuario = _usuarioRepository.login(email, senha);
            return usuario;
        }
    }
}
