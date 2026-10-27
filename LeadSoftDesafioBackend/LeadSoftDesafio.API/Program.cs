using LeadSoftDesafio.Infra.CrossCuting.IOC;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "LeadSoftDesafio",
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:4200/"
                                             );
                      });
});
builder.Services.AddServices();


builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => {
        options.SwaggerEndpoint("/openapi/v1.json", "LeadSoftDesafio API");
        options.RoutePrefix = "swagger";

    });
}



app.UseHttpsRedirection();
app.UseCors("LeadSoftDesafio");

app.UseAuthorization();

app.MapControllers();

app.Run();
