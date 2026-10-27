using LeadSoftDesafio.Domain.Ports;
using LeadSoftDesafio.Domain.ValuesObjects;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;

namespace LeadSoftDesafio.Aplication.Services
{
    public class AnexacaoArquivoService : IAnexacaoArquivoService
    {
         private readonly IAnexacaoArquivoRepository _anexacaoArquivo;
        public AnexacaoArquivoService(IAnexacaoArquivoRepository anexacaoArquivo)
        {
            _anexacaoArquivo = anexacaoArquivo;
        }

        void IAnexacaoArquivoService.AnexarArquivoService(IFormFile Imagem, string IdUsuario, string ImagemLgenda)
        {
            _anexacaoArquivo.AnexarArquivo(Imagem, IdUsuario, ImagemLgenda);
        }

        List<MediaResponse> IAnexacaoArquivoService.BuscarArquivoService(string IdUsuario)
        {
           var media = _anexacaoArquivo.BuscarArquivo(IdUsuario);
           return media;
        }
    }
}
