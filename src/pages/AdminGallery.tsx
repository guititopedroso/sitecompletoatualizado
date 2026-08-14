import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Instagram, ExternalLink, Loader2, CheckCircle2, RefreshCw, Eye, Key, ShieldCheck, AlertCircle, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { InstagramPost } from "./GalleryPage";

const AdminGallery = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [testingToken, setTestingToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ configured?: boolean; valid?: boolean; username?: string; media_count?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const loadStatusAndPosts = async () => {
    setRefreshing(true);
    try {
      // 1. Get Token status
      const status = await api.instagram.getStatus();
      setTokenStatus(status);

      // 2. Get stored token input
      const savedTokenObj = await api.instagram.getToken();
      if (savedTokenObj && savedTokenObj.token) {
        setTokenInput(savedTokenObj.token);
      }

      // 3. Get Posts
      const data = await api.instagram.getPosts();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Instagram:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadStatusAndPosts();
  }, []);

  const handleTestToken = async () => {
    if (!tokenInput.trim()) {
      toast({ variant: "destructive", title: "Aviso", description: "Introduza um Access Token do Instagram." });
      return;
    }

    setTestingToken(true);
    try {
      const res = await api.instagram.testToken(tokenInput.trim());
      if (res && res.success) {
        toast({ 
          title: "Token Válido! 🎉", 
          description: `Conectado com sucesso à conta @${res.username} (${res.media_count} publicações).` 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Token Inválido", 
          description: res.error || "O Meta não reconheceu este token." 
        });
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao testar", 
        description: err.message || "Falha na comunicação com a API do Instagram." 
      });
    }
    setTestingToken(false);
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      toast({ variant: "destructive", title: "Aviso", description: "Introduza um token antes de guardar." });
      return;
    }

    setSavingToken(true);
    try {
      await api.instagram.saveToken(tokenInput.trim());
      toast({ title: "Sucesso!", description: "O Access Token do Instagram foi guardado com sucesso." });
      await loadStatusAndPosts();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao guardar", description: err.message || "Não foi possível guardar o token." });
    }
    setSavingToken(false);
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-lg">
            <Instagram size={24} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">API Oficial do Instagram (@royalcoast.pt)</h2>
            <p className="text-xs text-muted-foreground">Sincronização em tempo real via Meta Graph API</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadStatusAndPosts} 
            disabled={refreshing}
            className="rounded-full text-xs"
          >
            <RefreshCw size={13} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Feed
          </Button>

          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-full text-xs font-bold shadow-md">
            <a href="https://www.instagram.com/royalcoast.pt" target="_blank" rel="noopener noreferrer">
              <Instagram size={14} className="mr-1.5" />
              Abrir @royalcoast.pt ↗
            </a>
          </Button>
        </div>
      </div>

      {/* Status & Token Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Token Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-purple-500" size={18} />
            <h3 className="font-display text-base font-bold text-foreground">Meta Instagram Access Token</h3>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Cole o **User Access Token** gerado no portal Meta Developers para que a galeria do site carregue em tempo real as publicações exatas da conta <strong>@royalcoast.pt</strong>.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Access Token do Instagram</label>
                {tokenStatus?.valid && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Encriptado & Protegido
                  </span>
                )}
              </div>
              <Input
                type="password"
                placeholder={tokenStatus?.valid ? "Token configurado com segurança (••••••••••••)" : "Cole aqui o token (IGAAOK...)"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="font-mono text-xs rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                <span>O token é guardado exclusivamente no servidor. O navegador dos visitantes nunca tem acesso ao token.</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestToken}
                disabled={testingToken || !tokenInput.trim()}
                className="rounded-xl text-xs font-semibold"
              >
                {testingToken ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <ShieldCheck size={14} className="mr-1.5 text-sky-500" />}
                Testar Token
              </Button>

              <Button
                type="button"
                onClick={handleSaveToken}
                disabled={savingToken || !tokenInput.trim()}
                className="ocean-gradient text-primary-foreground rounded-xl text-xs font-bold shadow-md"
              >
                {savingToken ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                Guardar Token
              </Button>

              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground rounded-xl ml-auto">
                <a href="/galeria" target="_blank" rel="noopener noreferrer">
                  <Eye size={14} className="mr-1.5 text-primary" />
                  Ver Galeria no Site
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-sm font-bold">Estado da Ligação Meta</h4>
              {tokenStatus?.valid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  Ativo 🟢
                </span>
              ) : tokenStatus?.configured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={12} />
                  Token Inválido 🔴
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Info size={12} />
                  Sem Token 🟡
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Conta Instagram:</span>
                <span className="font-bold text-foreground text-sm font-display">
                  {tokenStatus?.username ? `@${tokenStatus.username}` : "@royalcoast.pt"}
                </span>
              </div>

              {tokenStatus?.media_count !== undefined && (
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Publicações na conta:</span>
                  <span className="font-bold text-foreground text-sm font-display">
                    {tokenStatus.media_count} fotos/vídeos
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <p className="text-[11px] text-muted-foreground leading-snug">
              💡 Os tokens do Meta Graph API para contas de Instagram de empresas expiram após 60 dias se não forem renovados.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-amber-500/5 border border-purple-500/20 mb-8 text-xs text-muted-foreground">
        <h4 className="font-bold text-foreground mb-1.5 flex items-center gap-2 text-sm">
          <Info size={16} className="text-purple-500" />
          Como obter o Access Token no Meta Developers:
        </h4>
        <ol className="list-decimal list-inside space-y-1 ml-1 text-foreground/80">
          <li>Aceda a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.facebook.com</a> e crie uma App do tipo <strong>Instagram Basic Display</strong>.</li>
          <li>Adicione a conta <strong>@royalcoast.pt</strong> como Utilizador Testador da App.</li>
          <li>Gere o <strong>User Access Token</strong> e cole-o no campo acima.</li>
          <li>Clique em <strong>Testar Token</strong> e depois em <strong>Guardar Token</strong>.</li>
        </ol>
      </div>

      {/* Instagram Feed Grid Preview */}
      <h3 className="font-display text-sm font-bold text-foreground mb-4">
        Publicações Carregadas em Tempo Real ({posts.length})
      </h3>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3 text-primary" size={28} />
          <p className="text-xs font-medium">A carregar publicações do Instagram...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-3xl">
          <Instagram size={40} className="mx-auto mb-3 opacity-30 text-purple-500" />
          <p className="text-sm font-medium">Nenhuma publicação encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">Insira um Access Token do Instagram válido para carregar as fotos reais.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm border border-border bg-muted"
            >
              <img
                src={post.thumbnail_url || post.media_url}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white z-10 text-xs">
                <p className="line-clamp-3 text-[10px] text-white/90 leading-tight">
                  {post.caption}
                </p>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:underline mt-2"
                >
                  <span>Ver no Instagram</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AdminGallery;