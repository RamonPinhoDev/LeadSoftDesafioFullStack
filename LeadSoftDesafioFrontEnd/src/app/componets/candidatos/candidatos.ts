import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  Candidato,
  Comentario,
  Foto,
  Services,
  mensagemErro,
} from '../../services/services/services';

interface FotoDetalhe extends Foto {
  comentarios: Comentario[];
  erroComentarios?: string;
  textoComentario?: string;
  erroEnvioComentario?: string;
  avisoComentario?: string;
}

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-candidatos',
  styleUrl: './candidatos.css',
  templateUrl: './candidatos.html',
})
export class Candidatos implements OnInit, OnDestroy {
  private readonly service = inject(Services);
  private readonly route = inject(ActivatedRoute);
  readonly detalhes = this.route.snapshot.paramMap.has('id');
  readonly candidato = signal<Candidato | null>(null);
  readonly fotos = signal<FotoDetalhe[]>([]);
  readonly confirmarCandidato = signal(false);
  readonly comentarioPendente = signal<Comentario | null>(null);
  private readonly router = inject(Router);
  readonly candidatos = signal<Candidato[]>([]);
  readonly carregando = signal(false);
  readonly excluindo = signal(false);
  readonly erro = signal('');
  readonly aviso = signal('');
  readonly confirmar = signal<Candidato | null>(null);
  readonly arquivoFoto = signal<File | null>(null);
  readonly previaFoto = signal('');
  readonly erroFoto = signal('');
  readonly validandoFoto = signal(false);
  readonly enviandoFoto = signal(false);
  readonly enviandoComentario = signal(false);
  private selecaoFoto = 0;
  private intervaloComentarios?: ReturnType<typeof setInterval>;
  private atualizandoComentarios = false;
  private revisaoComentarios = 0;
  private destruido = false;
  private readonly comentariosExcluidos = new Set<string>();
  legendaFoto = '';
  busca = '';
  ngOnInit(): void {
    void this.carregar();
    if (this.detalhes)
      this.intervaloComentarios = setInterval(() => void this.atualizarComentarios(), 5000);
  }
  ngOnDestroy(): void {
    this.destruido = true;
    this.revisaoComentarios++;
    clearInterval(this.intervaloComentarios);
    this.selecaoFoto++;
    this.limparFoto();
  }
  async atualizarComentarios(): Promise<void> {
    if (
      this.destruido ||
      !this.detalhes ||
      document.visibilityState === 'hidden' ||
      this.atualizandoComentarios ||
      this.carregando() ||
      this.enviandoComentario() ||
      this.enviandoFoto() ||
      this.excluindo() ||
      !this.service.estaAutenticado()
    )
      return;
    const fotos = this.fotos().filter((foto) => foto.mediaId);
    if (!fotos.length) return;
    const revisao = this.revisaoComentarios;
    this.atualizandoComentarios = true;
    try {
      const resultados = await Promise.all(
        fotos.map(async (foto) => {
          try {
            return {
              foto,
              comentarios: await firstValueFrom(this.service.listarComentarios(foto.mediaId!)),
            };
          } catch {
            return null;
          }
        }),
      );
      if (this.destruido || revisao !== this.revisaoComentarios) return;
      this.fotos.update((atuais) =>
        atuais.map((foto) => {
          const resultado = resultados.find((item) => item?.foto === foto);
          return resultado
            ? {
                ...foto,
                comentarios: this.comentariosVisiveis(resultado.comentarios),
                erroComentarios: '',
              }
            : foto;
        }),
      );
    } finally {
      this.atualizandoComentarios = false;
    }
  }
  private comentariosVisiveis(comentarios: Comentario[]): Comentario[] {
    return comentarios.filter(
      (comentario) =>
        !comentario.comentarioId || !this.comentariosExcluidos.has(comentario.comentarioId),
    );
  }
  private limparFoto(): void {
    const previa = this.previaFoto();
    if (previa) URL.revokeObjectURL(previa);
    this.previaFoto.set('');
    this.arquivoFoto.set(null);
  }
  tentarOutraFoto(campo: HTMLInputElement): void {
    if (this.enviandoFoto() || this.excluindo()) return;
    this.selecaoFoto++;
    this.limparFoto();
    this.erroFoto.set('');
    this.validandoFoto.set(false);
    campo.value = '';
    campo.click();
  }
  async selecionarFoto(evento: Event): Promise<void> {
    if (this.enviandoFoto()) return;
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    const selecao = ++this.selecaoFoto;
    this.limparFoto();
    this.erroFoto.set('');
    this.validandoFoto.set(false);
    campo.value = '';
    if (!arquivo) return;
    if (arquivo.type !== 'image/png' || !/\.png$/i.test(arquivo.name)) {
      this.erroFoto.set('Selecione uma imagem em formato PNG.');
      return;
    }
    if (!arquivo.size || arquivo.size > 10 * 1024 * 1024) {
      this.erroFoto.set('A imagem deve ter conteúdo e no máximo 10 MB.');
      return;
    }
    this.validandoFoto.set(true);
    const previa = URL.createObjectURL(arquivo);
    try {
      const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Não foi possível ler a imagem. Escolha outro PNG.'));
        img.src = previa;
      });
      if (selecao !== this.selecaoFoto) {
        URL.revokeObjectURL(previa);
        return;
      }
      if (imagem.naturalWidth !== 1080 || imagem.naturalHeight !== 1080)
        throw new Error('A foto deve ter exatamente 1080 × 1080 pixels.');
      this.arquivoFoto.set(arquivo);
      this.previaFoto.set(previa);
    } catch (erro) {
      URL.revokeObjectURL(previa);
      if (selecao === this.selecaoFoto) this.erroFoto.set(mensagemErro(erro));
    } finally {
      if (selecao === this.selecaoFoto) this.validandoFoto.set(false);
    }
  }
  async adicionarFoto(): Promise<void> {
    if (
      this.enviandoFoto() ||
      this.enviandoComentario() ||
      this.validandoFoto() ||
      this.carregando() ||
      this.excluindo()
    )
      return;
    if (!this.verificarSessao()) return;
    const pessoa = this.candidato();
    const arquivo = this.arquivoFoto();
    const legenda = this.legendaFoto.trim();
    this.erroFoto.set('');
    this.aviso.set('');
    if (!pessoa || pessoa.id !== this.route.snapshot.paramMap.get('id')) {
      this.erroFoto.set(
        'Não foi possível identificar o candidato. Atualize os detalhes e tente novamente.',
      );
      return;
    }
    if (!arquivo) {
      this.erroFoto.set('Selecione uma foto PNG de 1080 × 1080 pixels.');
      return;
    }
    if (!legenda || legenda.length > 500) {
      this.erroFoto.set('Informe uma legenda de até 500 caracteres.');
      return;
    }
    this.enviandoFoto.set(true);
    try {
      await firstValueFrom(this.service.enviarFoto(pessoa.id, legenda, arquivo));
      this.limparFoto();
      this.legendaFoto = '';
      this.aviso.set(`Foto adicionada ao candidato ${pessoa.nome}.`);
      await this.carregarDetalhes();
    } catch (erro) {
      this.erroFoto.set(mensagemErro(erro));
    } finally {
      this.enviandoFoto.set(false);
    }
  }
  async comentarFoto(foto: FotoDetalhe): Promise<void> {
    if (this.enviandoComentario() || this.enviandoFoto() || this.excluindo() || this.carregando())
      return;
    if (!this.verificarSessao() || !this.fotos().includes(foto)) return;
    const texto = foto.textoComentario?.trim() ?? '';
    if (!foto.mediaId || !texto || texto.length > 1000) return;
    this.enviandoComentario.set(true);
    this.revisaoComentarios++;
    foto.erroEnvioComentario = '';
    foto.avisoComentario = '';
    try {
      await firstValueFrom(this.service.comentar(foto.mediaId, texto));
      foto.textoComentario = '';
      foto.avisoComentario = 'Comentário publicado.';
      try {
        foto.comentarios = this.comentariosVisiveis(
          await firstValueFrom(this.service.listarComentarios(foto.mediaId)),
        );
        foto.erroComentarios = '';
      } catch (erro) {
        foto.erroComentarios = mensagemErro(erro);
      }
    } catch (erro) {
      foto.erroEnvioComentario = mensagemErro(erro);
    } finally {
      this.fotos.update((fotos) => [...fotos]);
      this.enviandoComentario.set(false);
    }
  }
  private verificarSessao(): boolean {
    if (this.service.estaAutenticado()) return true;
    void this.router.navigateByUrl('/login');
    return false;
  }
  filtrados(): Candidato[] {
    const termo = this.busca.toLowerCase().trim();
    return this.candidatos().filter((c) => `${c.nome} ${c.email}`.toLowerCase().includes(termo));
  }
  async carregar(): Promise<void> {
    if (this.detalhes) {
      await this.carregarDetalhes();
      return;
    }
    if (!this.verificarSessao() || this.carregando()) return;
    this.carregando.set(true);
    this.erro.set('');
    try {
      const candidatos = await firstValueFrom(this.service.listarCandidatos());
      this.candidatos.set(
        candidatos.filter((c) => c.email.toLowerCase() !== this.service.adminEmail.toLowerCase()),
      );
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
  async excluir(): Promise<void> {
    const candidato = this.confirmar();
    if (!candidato || this.excluindo() || !this.verificarSessao()) return;
    this.excluindo.set(true);
    this.erro.set('');
    this.aviso.set('');
    try {
      await firstValueFrom(this.service.excluirCandidato(candidato.id));
      this.candidatos.update((lista) => lista.filter((c) => c.id !== candidato.id));
      this.confirmar.set(null);
      this.aviso.set('Inscrição excluída.');
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.excluindo.set(false);
    }
  }
  async carregarDetalhes(): Promise<void> {
    if (!this.verificarSessao() || this.carregando() || this.enviandoComentario()) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.erro.set('Inscrição não encontrada.');
      return;
    }
    this.carregando.set(true);
    this.revisaoComentarios++;
    this.erro.set('');
    try {
      // Carrega os dados pessoais mesmo quando houver uma falha no endpoint de fotos.
      this.candidato.set(await firstValueFrom(this.service.buscarCandidato(id)));
      const fotos = await firstValueFrom(this.service.listarFotos(id));
      const detalhes = await Promise.all(
        fotos.map(async (foto) => {
          if (!foto.mediaId) return { ...foto, comentarios: [] };
          try {
            return {
              ...foto,
              comentarios: this.comentariosVisiveis(
                await firstValueFrom(this.service.listarComentarios(foto.mediaId)),
              ),
            };
          } catch (erro) {
            return { ...foto, comentarios: [], erroComentarios: mensagemErro(erro) };
          }
        }),
      );
      this.fotos.set(detalhes);
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
  async excluirCandidato(): Promise<void> {
    const candidato = this.candidato();
    if (
      !candidato ||
      !this.confirmarCandidato() ||
      this.excluindo() ||
      this.enviandoFoto() ||
      this.enviandoComentario() ||
      !this.verificarSessao()
    )
      return;
    this.excluindo.set(true);
    this.erro.set('');
    try {
      await firstValueFrom(this.service.excluirCandidato(candidato.id));
      await this.router.navigateByUrl('/admin');
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.excluindo.set(false);
    }
  }
  async excluirComentario(): Promise<void> {
    const comentario = this.comentarioPendente();
    if (
      !comentario?.comentarioId ||
      this.excluindo() ||
      this.enviandoComentario() ||
      !this.verificarSessao()
    )
      return;
    this.excluindo.set(true);
    this.revisaoComentarios++;
    this.erro.set('');
    this.aviso.set('');
    try {
      await firstValueFrom(this.service.excluirComentario(comentario.comentarioId));
      this.comentariosExcluidos.add(comentario.comentarioId);
      this.fotos.update((fotos) =>
        fotos.map((f) => ({
          ...f,
          comentarios: f.comentarios.filter((c) => c.comentarioId !== comentario.comentarioId),
        })),
      );
      this.comentarioPendente.set(null);
      this.aviso.set('Comentário excluído.');
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.excluindo.set(false);
    }
  }
  solicitarExclusaoComentario(comentario: Comentario): void {
    if (this.excluindo() || this.enviandoComentario() || !this.verificarSessao()) return;
    this.erro.set('');
    if (!comentario.comentarioId) {
      this.comentarioPendente.set(null);
      this.erro.set('Não foi possível identificar este comentário para exclusão.');
      return;
    }
    this.comentarioPendente.set(comentario);
  }
}
