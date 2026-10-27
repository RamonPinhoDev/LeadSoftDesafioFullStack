using LeadSoftDesafio.Domain.ValuesObjects;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IAnexacaoArquivoService
    {
        public void AnexarArquivoService(IFormFile imagem, string IdUsuario, string ImagemLgenda);
        public List<MediaResponse> BuscarArquivoService(string IdUsuario);
    }
}
