import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Comentario, FotoGaleria, Services, mensagemErro } from '../../services/services/services';

@Component({
  imports: [RouterLink, FormsModule, DatePipe],
  selector: 'app-galeria',
  styleUrl: './galeria.css',
  templateUrl: './galeria.html',
})
export class Galeria implements OnInit, OnDestroy {
  private readonly service = inject(Services);
  readonly fotos = signal<FotoGaleria[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly selecionada = signal<FotoGaleria | null>(null);
  readonly comentarios = signal<Comentario[]>([]);
  readonly carregandoComentarios = signal(false);
  readonly enviandoComentario = signal(false);
  readonly erroComentario = signal('');
  readonly avisoComentario = signal('');
  private intervaloComentarios?: ReturnType<typeof setInterval>;
  private atualizandoComentarios = false;
  private revisaoComentarios = 0;
  private destruido = false;
  busca = '';
  textoComentario = '';
  ngOnInit(): void {
    void this.carregar();
    this.intervaloComentarios = setInterval(() => void this.atualizarComentarios(), 5000);
  }
  ngOnDestroy(): void {
    this.destruido = true;
    this.revisaoComentarios++;
    clearInterval(this.intervaloComentarios);
  }
  async atualizarComentarios(): Promise<void> {
    const foto = this.selecionada();
    if (
      !foto?.mediaId ||
      this.destruido ||
      document.visibilityState === 'hidden' ||
      this.atualizandoComentarios ||
      this.carregandoComentarios() ||
      this.enviandoComentario()
    )
      return;
    this.atualizandoComentarios = true;
    try {
      await this.carregarComentarios(foto, true);
    } finally {
      this.atualizandoComentarios = false;
    }
  }
  fotosFiltradas(): FotoGaleria[] {
    const termo = this.busca.trim().toLocaleLowerCase('pt-BR');
    return this.fotos().filter((f) =>
      `${f.autor} ${f.imagemLgenda}`.toLocaleLowerCase('pt-BR').includes(termo),
    );
  }
  async carregar(): Promise<void> {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set('');
    try {
      this.fotos.set(await firstValueFrom(this.service.carregarGaleria()));
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
  async abrir(foto: FotoGaleria): Promise<void> {
    if (this.enviandoComentario()) return;
    this.revisaoComentarios++;
    this.selecionada.set(foto);
    this.comentarios.set([]);
    this.textoComentario = '';
    setTimeout(
      () =>
        document
          .getElementById('foto-detalhe')
          ?.scrollIntoView?.({ behavior: 'auto', block: 'start' }),
      0,
    );
    this.erroComentario.set('');
    this.avisoComentario.set('');
    if (!foto.mediaId) {
      this.carregandoComentarios.set(false);
      return;
    }
    await this.carregarComentarios(foto);
  }
  private async carregarComentarios(foto: FotoGaleria, silencioso = false): Promise<void> {
    const revisao = ++this.revisaoComentarios;
    if (!silencioso) this.carregandoComentarios.set(true);
    try {
      const comentarios = await firstValueFrom(this.service.listarComentarios(foto.mediaId!));
      if (
        !this.destruido &&
        revisao === this.revisaoComentarios &&
        this.selecionada()?.chave === foto.chave
      )
        this.comentarios.set(comentarios);
    } catch (erro) {
      if (
        !silencioso &&
        !this.destruido &&
        revisao === this.revisaoComentarios &&
        this.selecionada()?.chave === foto.chave
      )
        this.erroComentario.set(mensagemErro(erro));
    } finally {
      if (
        !silencioso &&
        !this.destruido &&
        revisao === this.revisaoComentarios &&
        this.selecionada()?.chave === foto.chave
      )
        this.carregandoComentarios.set(false);
    }
  }
  fechar(): void {
    if (!this.enviandoComentario()) {
      this.revisaoComentarios++;
      this.selecionada.set(null);
      this.carregandoComentarios.set(false);
    }
  }
  async comentar(): Promise<void> {
    const foto = this.selecionada();
    const texto = this.textoComentario.trim();
    if (!foto?.mediaId || !texto || texto.length > 1000 || this.enviandoComentario()) return;
    this.enviandoComentario.set(true);
    this.revisaoComentarios++;
    this.carregandoComentarios.set(false);
    this.erroComentario.set('');
    this.avisoComentario.set('');
    try {
      await firstValueFrom(this.service.comentar(foto.mediaId, texto));
      this.textoComentario = '';
      this.avisoComentario.set('Comentário enviado.');
      await this.carregarComentarios(foto);
    } catch (erro) {
      this.erroComentario.set(mensagemErro(erro));
    } finally {
      this.enviandoComentario.set(false);
    }
  }
}
