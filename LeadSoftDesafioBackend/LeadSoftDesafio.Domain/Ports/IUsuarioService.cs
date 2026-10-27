using LeadSoftDesafio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IUsuarioService
    {
        public void AdicionarUsuarioService(Usuario usuario);
        public IEnumerable<Usuario> ObterUsuariosService();

        public Usuario ObterUsuarioPorIdService(string id);
        public Usuario ObterUsuarioPorEmailService(string email);
        public void AtualizarUsuarioService(Usuario usuario);
        public void ExcluirUsuarioService(string id);
        public Usuario loginService(string email, string senha);
    }
}
