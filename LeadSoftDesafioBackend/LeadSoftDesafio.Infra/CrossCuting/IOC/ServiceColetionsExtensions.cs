
using LeadSoftDesafio.Aplication.Services;
using LeadSoftDesafio.Domain.Ports;
using LeadSoftDesafio.Infra.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Raven.Client.Documents;
using System.Security.Cryptography.X509Certificates;

namespace LeadSoftDesafio.Infra.CrossCuting.IOC
{
    public static class ServiceColetionsExtensions
    {

        public static IServiceCollection AddServices(this IServiceCollection services)
        {
            services.AddScoped<IComentarioRepository, ComentarioRepository>();
            services.AddScoped<IComentarioService, ComentarioService>();
            services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            services.AddScoped<IUsuarioService, UsuarioService>();
            services.AddScoped<IAnexacaoArquivoService, AnexacaoArquivoService>();
            services.AddScoped<IAnexacaoArquivoRepository, AnexacaoArquivo>();

            services.AddSingleton<IDocumentStore>(
                ctx => {

                    string certificatePath = @"D:\\Udemy\\ProjetosC#\\RavenDB\\RavenDB-7.2.7-windows-x64\\ramondev.Cluster.Settings 2026-10-23 01-52\\admin.client.certificate.ramondev.pfx";
                    var x509Certificate = new X509Certificate2(certificatePath);

                    var loja = new DocumentStore { 
                        Urls = new string [] { "https://a.ramondev.development.run/" },
                        Database = "RavenDBProjeto", Certificate = x509Certificate
                    };
                    

                    loja.Initialize();


                    return loja;

                });



            return services;
        }
    }
}
