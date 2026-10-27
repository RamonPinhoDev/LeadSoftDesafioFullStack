using LeadSoftDesafio.Domain.Entities;
using LeadSoftDesafio.Domain.Ports;
using LeadSoftDesafio.Domain.ValuesObjects;
using Microsoft.AspNetCore.Http;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations.Attachments;
using System;
using System.Collections.Generic;
using System.Text;
using System.Xml.Linq;

namespace LeadSoftDesafio.Infra.Repositories
{
    public class AnexacaoArquivo : IAnexacaoArquivoRepository
    {
        private readonly IDocumentStore _documentStore;
        public AnexacaoArquivo(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }
        public void AnexarArquivo(IFormFile Imagem, string IdUsuario, string ImagemLgenda)
        {
            if (false ==png(Imagem.FileName))
            {
                throw new ArgumentException("Apenas arquivos PNG são permitidos.");
            }

            using var session = _documentStore.OpenSession();
            var usuario = session.Load<Usuario>(IdUsuario);
            var media = new Media
            {MediaId = Guid.NewGuid().ToString(),
                UserId = IdUsuario,
                ImagemLgenda = ImagemLgenda,
                ImagemNome = Imagem.FileName,
            };
            session.Store(media);
            session.SaveChanges();

          //  var attachmentPath = $"{caminhoArquivo}\\{nomeArquivo}";

            var remoteParameters = new RemoteAttachmentParameters(
        identifier: usuario.Id,
        at: DateTime.UtcNow.AddDays(1));


            //https://docs.ravendb.net/7.2/document-extensions/attachments/store-attachments/store-attachments-remote


            using (var stream = Imagem.OpenReadStream())
            {
                var storeParameters = new StoreAttachmentParameters(Imagem.FileName, stream)
                {
                    RemoteParameters = remoteParameters,
                    ContentType = "image/png"
                };

               

                session.Advanced.Attachments.Store(usuario.Id, storeParameters);

                session.SaveChanges();

                
            }







        }

        public  List<MediaResponse> BuscarArquivo(string IdUsuario)
        {var img = new List<MediaResponse>();
            using var session = _documentStore.OpenSession();
            var usuario = session.Load<Usuario>(IdUsuario);

            var attNames = session.Advanced.Attachments.GetNames(usuario);
            IEnumerable<AttachmentRequest> attList = attNames.Select(x =>
        new AttachmentRequest(IdUsuario, x.Name));

            // Call 'GetNames', pass the document entity
            AttachmentName[] attachmentNames = session.Advanced.Attachments.GetNames(usuario);
            IEnumerator<AttachmentEnumeratorResult> att = session.Advanced.Attachments.Get(attList);

            while (att.MoveNext())
            {
                AttachmentEnumeratorResult res = att.Current;

                // Attachment metadata (name, content type, size, hash, etc.)
                AttachmentDetails attachmentDetails = res.Details;

                // Attachment content stream
                Stream attachmentStream = res.Stream;

                using var memoryStream = new MemoryStream();

                res.Stream.CopyTo(memoryStream);

                byte[] binario = memoryStream.ToArray();

                var media = session.Query<Media>().FirstOrDefault(x => x.ImagemNome == attachmentDetails.Name);
                //if (media == null)
                //{
                //    img.Add(new MediaResponse());
                //}
                img.Add(new MediaResponse
                {  ImagemId = media.MediaId,
                    Imagem = binario,
                    ImagemLgenda = media?.ImagemLgenda ?? string.Empty,

                });
            }
            if (img.Count == 0)
            {
                return new List<MediaResponse>();
            }

            return img;
        }





        private bool png(string img)
        {
            var Char = img.ToCharArray();

            var charTotal = Char.Length;

            for(int i = 0; i < charTotal; i++)
            {
                if (Char[i] == '.')
                {
                    var ext = img.Substring(i + 1, charTotal - (i + 1));
                    if (ext.ToLower() == "png")
                    {
                        return true;
                    }
                }
            }


            return false;
        }
    }
}
