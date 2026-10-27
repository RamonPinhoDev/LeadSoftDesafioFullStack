using LeadSoftDesafio.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IUsuarioRepository
    {
        public void AdicionarUsuario(Usuario usuario);

        public IEnumerable<Usuario> ObterUsuarios();

        public Usuario ObterUsuarioPorId(string id);
        public Usuario ObterUsuarioPorEmail(string email);
        public void AtualizarUsuario(Usuario usuario);
        public void ExcluirUsuario(string id);
        public Usuario login(string email, string senha);
    }
}
