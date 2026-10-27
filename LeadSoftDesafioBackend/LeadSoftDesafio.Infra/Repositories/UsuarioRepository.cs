using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Infra.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly IDocumentStore _documentStore;

        public UsuarioRepository(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }
        public void AdicionarUsuario(Usuario usuario)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            session.Store(usuario);
            session.SaveChanges();
        }

        public void AtualizarUsuario(Usuario usuario)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            session.Query<Usuario>().FirstOrDefault(c => c.Id == usuario.Id);
            session.Store(usuario);
            session.SaveChanges();
        }

        public void ExcluirUsuario(string id)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            var usuario = session.Query<Usuario>().FirstOrDefault(c => c.Id == id);
            session.Delete(usuario);
            session.SaveChanges();
        }

        public Usuario ObterUsuarioPorEmail(string email)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            var usuario = session.Query<Usuario>().FirstOrDefault(c => c.Email == email);
            return usuario;
        }

        public Usuario ObterUsuarioPorId(string id)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            var usuario = session.Query<Usuario>().FirstOrDefault(c => c.Id == id);
            return usuario;
        }

        public IEnumerable<Usuario> ObterUsuarios()
        {
            using IDocumentSession session = _documentStore.OpenSession();
            var usuarios = session.Query<Usuario>().ToList();
            return usuarios;
        }


        public Usuario login(string email, string senha)
        {
            using IDocumentSession session = _documentStore.OpenSession();
            var usuario = session.Query<Usuario>().FirstOrDefault(c => c.Email == email && c.Senha == senha);
            if (usuario == null)
            {
                throw new Exception("Usuário não encontrado");
            }

            return usuario;
        }
    }
}
