using LeadSoftDesafio.Domain.ValuesObjects;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace LeadSoftDesafio.Domain.Ports
{
    public interface IAnexacaoArquivoRepository
    {
        public void AnexarArquivo(IFormFile imagem, string IdUsuario, string ImagemLgenda);
        public List<MediaResponse> BuscarArquivo(string IdUsuario);
    }
}
