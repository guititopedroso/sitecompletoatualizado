import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="ocean-gradient py-16 px-4">
      <div className="container-max">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-800 text-primary-foreground">
          Política de Privacidade
        </h1>
        <p className="text-primary-foreground/70 mt-2">
          Última atualização: março de 2026 · Em conformidade com o RGPD (Regulamento Geral sobre a Proteção de Dados)
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="container-max px-4 py-12 max-w-3xl">
      <div className="prose prose-lg max-w-none text-foreground space-y-8">

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">1. Responsável pelo Tratamento</h2>
          <p className="text-muted-foreground leading-relaxed">
            A ValeJet, com sede em Setúbal, Portugal, é a entidade responsável pelo tratamento dos dados pessoais recolhidos através deste website e no âmbito da prestação dos seus serviços de aluguer de motas de água nas zonas de Setúbal e Tróia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">2. Dados Pessoais Recolhidos</h2>
          <p className="text-muted-foreground leading-relaxed">
            No âmbito da utilização do website e da realização de reservas, a ValeJet pode recolher os seguintes dados pessoais:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Dados de identificação:</strong> nome completo, documento de identificação.</li>
            <li><strong>Dados de contacto:</strong> endereço de e-mail, número de telemóvel.</li>
            <li><strong>Dados de reserva:</strong> data, hora, experiência selecionada, número de participantes, local de partida.</li>
            <li><strong>Dados de navegação:</strong> endereço IP, tipo de browser, páginas visitadas, cookies (ver secção 7).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">3. Finalidades do Tratamento</h2>
          <p className="text-muted-foreground leading-relaxed">
            Os dados pessoais recolhidos são tratados para as seguintes finalidades:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Gestão de reservas:</strong> processamento, confirmação e gestão das reservas de atividades.</li>
            <li><strong>Comunicação:</strong> contacto com o utilizador para confirmação de reservas, alterações, cancelamentos ou informações de segurança.</li>
            <li><strong>Cumprimento de obrigações legais:</strong> nomeadamente as decorrentes do Edital n.º 97/2022 da Capitania do Porto de Setúbal e demais legislação marítima aplicável, incluindo a comunicação de dados às autoridades marítimas quando exigido.</li>
            <li><strong>Segurança:</strong> registo de participantes para efeitos de segurança marítima e seguros.</li>
            <li><strong>Melhoria do serviço:</strong> análise estatística anónima para melhoria da experiência do utilizador no website.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">4. Base Legal do Tratamento</h2>
          <p className="text-muted-foreground leading-relaxed">
            O tratamento dos dados pessoais baseia-se nas seguintes bases legais, em conformidade com o artigo 6.º do Regulamento (UE) 2016/679 (RGPD):
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Execução de contrato:</strong> os dados são necessários para a prestação do serviço contratado (reserva e aluguer de motas de água).</li>
            <li><strong>Cumprimento de obrigações legais:</strong> nomeadamente as impostas pela legislação marítima portuguesa, incluindo o Decreto-Lei n.º 93/2018 (RJNR) e o Edital n.º 97/2022.</li>
            <li><strong>Consentimento:</strong> para o envio de comunicações de marketing, quando aplicável.</li>
            <li><strong>Interesse legítimo:</strong> para garantir a segurança dos participantes e a melhoria dos serviços.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">5. Partilha de Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Os dados pessoais poderão ser partilhados com as seguintes entidades, quando necessário:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Capitania do Porto de Setúbal / Autoridade Marítima Nacional:</strong> em cumprimento de obrigações legais relativas à segurança marítima e à fiscalização da navegação.</li>
            <li><strong>Polícia Marítima (CLPM de Setúbal):</strong> quando exigido para efeitos de fiscalização ou emergências.</li>
            <li><strong>Companhias de seguros:</strong> para gestão de sinistros, quando aplicável.</li>
            <li><strong>Prestadores de serviços:</strong> entidades que auxiliam na operação do website e processamento de reservas (e.g., serviço de e-mail), atuando como subcontratantes nos termos do RGPD.</li>
            <li><strong>ICNF (Instituto da Conservação da Natureza e das Florestas):</strong> quando exigido no âmbito da monitorização ambiental na RNES e no PNA.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Não procedemos à transferência de dados pessoais para países terceiros fora do Espaço Económico Europeu.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">6. Prazo de Conservação</h2>
          <p className="text-muted-foreground leading-relaxed">
            Os dados pessoais são conservados durante os seguintes períodos:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Dados de reserva:</strong> 5 anos após a realização da atividade, em conformidade com as obrigações fiscais e legais.</li>
            <li><strong>Dados de segurança marítima:</strong> pelo período exigido pela legislação marítima aplicável.</li>
            <li><strong>Dados de navegação no website:</strong> 12 meses.</li>
            <li><strong>Dados de marketing:</strong> até à retirada do consentimento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            O website da ValeJet utiliza cookies para melhorar a experiência de navegação. Os cookies utilizados incluem:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Cookies essenciais:</strong> necessários para o funcionamento do website.</li>
            <li><strong>Cookies de desempenho:</strong> para análise estatística anónima do tráfego.</li>
            <li><strong>Cookies de funcionalidade:</strong> para memorizar preferências do utilizador.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            O utilizador pode gerir as suas preferências de cookies através das configurações do browser.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">8. Direitos do Titular dos Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Em conformidade com o RGPD, o titular dos dados tem os seguintes direitos:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Direito de acesso:</strong> obter confirmação e acesso aos dados pessoais tratados.</li>
            <li><strong>Direito de retificação:</strong> solicitar a correção de dados inexatos ou incompletos.</li>
            <li><strong>Direito ao apagamento:</strong> solicitar a eliminação dos dados, quando aplicável.</li>
            <li><strong>Direito à limitação do tratamento:</strong> restringir o tratamento em determinadas circunstâncias.</li>
            <li><strong>Direito à portabilidade:</strong> receber os dados num formato estruturado e de uso corrente.</li>
            <li><strong>Direito de oposição:</strong> opor-se ao tratamento dos dados para determinadas finalidades.</li>
            <li><strong>Direito de retirar o consentimento:</strong> a qualquer momento, sem comprometer a licitude do tratamento anterior.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Para exercer qualquer destes direitos, o utilizador pode contactar-nos através do e-mail indicado na secção de contactos do website.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">9. Direito de Reclamação</h2>
          <p className="text-muted-foreground leading-relaxed">
            O titular dos dados tem o direito de apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD), a autoridade de controlo competente em Portugal:
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong><br />
            Rua de São Bento, n.º 148, 3.º · 1200-821 Lisboa<br />
            Tel: (+351) 213 928 400<br />
            Website: <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">www.cnpd.pt</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">10. Segurança dos Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            A ValeJet adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra o acesso não autorizado, perda, destruição ou alteração, em conformidade com o artigo 32.º do RGPD.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">11. Alterações à Política de Privacidade</h2>
          <p className="text-muted-foreground leading-relaxed">
            A ValeJet reserva-se o direito de alterar a presente Política de Privacidade a qualquer momento. As alterações serão publicadas nesta página com indicação da data de atualização. Recomendamos a consulta periódica desta página.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">12. Contactos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para questões relacionadas com a proteção de dados pessoais, o utilizador pode contactar a ValeJet através dos meios disponibilizados na secção de contactos do website.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
