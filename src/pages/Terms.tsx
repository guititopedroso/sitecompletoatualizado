import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="ocean-gradient py-16 px-4">
      <div className="container-max">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-800 text-primary-foreground">
          Termos e Condições
        </h1>
        <p className="text-primary-foreground/70 mt-2">
          Última atualização: março de 2026 · Conforme Edital n.º 97/2022 da Capitania do Porto de Setúbal
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="container-max px-4 py-12 max-w-3xl">
      <div className="prose prose-lg max-w-none text-foreground space-y-8">

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">1. Objeto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Os presentes Termos e Condições regulam a utilização dos serviços de aluguer de motas de água (jet skis) prestados pela ValeJet, com operações na área de jurisdição da Capitania do Porto de Setúbal, abrangendo as zonas de Setúbal e Tróia, em conformidade com o Edital n.º 97/2022, de 28 de janeiro, publicado no Diário da República.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">2. Enquadramento Legal</h2>
          <p className="text-muted-foreground leading-relaxed">
            A navegação e permanência no espaço de jurisdição da Capitania do Porto de Setúbal rege-se pelo Edital n.º 97/2022, que estabelece instruções e determinações para a navegação e permanência no espaço de jurisdição marítima da Capitania do Porto de Setúbal, sem prejuízo da legislação aplicável, nomeadamente:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Decreto-Lei n.º 44/2002, de 2 de março (Sistema da Autoridade Marítima)</li>
            <li>Decreto-Lei n.º 93/2018, de 13 de novembro (Regime Jurídico da Náutica de Recreio – RJNR)</li>
            <li>Regulamento Internacional para Evitar Abalroamentos no Mar (RIEAM)</li>
            <li>Decreto-Lei n.º 45/2002, de 2 de março (Regime das contraordenações marítimas)</li>
            <li>Plano de Ordenamento do Parque Natural da Arrábida (POPNA) e Regulamento do Parque Marinho Luiz Saldanha (PMLS)</li>
            <li>Regulamento da Reserva Natural do Estuário do Sado (RNES)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">3. Área de Navegação e Restrições</h2>
          <p className="text-muted-foreground leading-relaxed">
            O espaço de jurisdição da Capitania do Porto de Setúbal compreende, na costa, desde o paralelo a norte da lagoa de Albufeira (Lat.=38° 31,46' N) até ao paralelo da foz da ribeira das Fontainhas – Aberta Nova (Lat.=38° 10,54' N), e no rio Sado, o estuário desde a sua embocadura até à ponte velha de Alcácer do Sal.
          </p>
          <h3 className="font-display text-xl font-600 text-foreground mt-6">3.1 Zonas Interditas a Motas de Água</h3>
          <p className="text-muted-foreground leading-relaxed">
            Nos termos do Edital n.º 97/2022, é <strong>proibida a circulação de motas de água, jet skis e equipamentos similares</strong> (pranchas motorizadas) nas seguintes áreas:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Canal sul do estuário do Sado</strong> – zona de maior sensibilidade para a comunidade de golfinhos roazes, conforme plano de ação do ICNF.</li>
            <li><strong>Triângulo Ponta do Adoxe – Boia Cardeal João Farto – Baliza 5</strong> – área de monitorização da população de golfinhos residentes.</li>
            <li><strong>Parque Marinho Luiz Saldanha</strong> – condicionamentos definidos no POPNA.</li>
            <li>Zonas onde vigorem restrições de barra condicionada ou barra fechada.</li>
          </ul>
          <h3 className="font-display text-xl font-600 text-foreground mt-6">3.2 Condições Meteorológicas</h3>
          <p className="text-muted-foreground leading-relaxed">
            A navegação pode ser condicionada ou interdita pelo Capitão do Porto em situações de condições meteorológicas adversas. Quando estejam em vigor avisos de temporal ou situação de barra fechada/condicionada, é proibido o trânsito ou exercício de qualquer atividade a jusante da linha Marina de Tróia – Baliza 5 – Outão.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">4. Requisitos do Utilizador</h2>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Idade mínima de 18 anos para condução da mota de água.</li>
            <li>É obrigatório o uso de <strong>colete salva-vidas</strong> por todos os ocupantes durante toda a atividade.</li>
            <li>O utilizador deve apresentar documento de identificação válido no momento da reserva.</li>
            <li>O utilizador compromete-se a seguir todas as instruções de segurança fornecidas pela equipa ValeJet e pelo briefing pré-atividade.</li>
            <li>É proibida a condução sob efeito de álcool ou substâncias psicotrópicas.</li>
            <li>É obrigatório respeitar os limites de velocidade e as zonas de navegação autorizadas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">5. Segurança da Navegação</h2>
          <p className="text-muted-foreground leading-relaxed">
            Em conformidade com o Capítulo I, ponto 3 do Edital n.º 97/2022 e com o RIEAM:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>A navegação deve respeitar o Regulamento Internacional para Evitar Abalroamentos no Mar (RIEAM), com especial atenção à Regra n.º 2 – Responsabilidade.</li>
            <li>Os utilizadores devem manter atenção permanente às condições meteorológicas, ao estado da barra e à presença de outras embarcações.</li>
            <li>É obrigatório manter distância de segurança de banhistas, embarcações de pesca, veleiros e outras embarcações.</li>
            <li>Os navegantes devem conhecer os sinais de situação da barra e avisos de temporal, conforme o Decreto-Lei n.º 283/87, de 25 de junho.</li>
            <li>Em caso de emergência, contactar o CLPM de Setúbal (tel. 265 105 123 / 918 498 049) ou canal 16 VHF (socorro).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">6. Proteção Ambiental</h2>
          <p className="text-muted-foreground leading-relaxed">
            A área de operação da ValeJet inclui zonas de elevado valor ambiental, nomeadamente a Reserva Natural do Estuário do Sado (RNES), o Parque Natural da Arrábida e zonas classificadas como Rede Natura 2000. Os utilizadores comprometem-se a:
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Não lançar detritos, plásticos ou qualquer substância poluente nas águas.</li>
            <li>Respeitar a fauna marinha, em especial a comunidade de golfinhos roazes-corvineiros do estuário do Sado.</li>
            <li>Não aproximar-se intencionalmente de animais marinhos.</li>
            <li>Cumprir todas as disposições do POPNA e da RNES relativas à preservação ambiental.</li>
            <li>Qualquer ocorrência de poluição deve ser comunicada às autoridades competentes (Capitania do Porto de Setúbal).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">7. Responsabilidade e Infrações</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nos termos do Edital n.º 97/2022, as infrações às determinações estabelecidas são passíveis de constituir ilícito contraordenacional, nos termos do Decreto-Lei n.º 45/2002, de 2 de março, enquadrado pelo regime geral das contraordenações (Decreto-Lei n.º 433/82), sem prejuízo de responsabilidade cível e criminal, quando aplicável.
          </p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>A fiscalização compete à Polícia Marítima e às autoridades policiais ou administrativas competentes.</li>
            <li>O utilizador é responsável por quaisquer danos causados ao equipamento por uso negligente ou indevido.</li>
            <li>A ValeJet reserva-se o direito de interromper a atividade a qualquer momento por razões de segurança.</li>
            <li>O utilizador assume a responsabilidade pelo cumprimento de todas as normas de navegação aplicáveis.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">8. Reservas e Cancelamentos</h2>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>As reservas estão sujeitas a confirmação pela equipa ValeJet.</li>
            <li>A ValeJet reserva-se o direito de cancelar ou reagendar atividades por razões de segurança, condições meteorológicas adversas ou situação de barra fechada/condicionada.</li>
            <li>Em caso de cancelamento por parte da ValeJet, será oferecido reagendamento ou reembolso integral.</li>
            <li>Cancelamentos pelo utilizador com menos de 24 horas de antecedência podem não ser reembolsados.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">9. Contactos da Autoridade Marítima</h2>
          <p className="text-muted-foreground leading-relaxed">
            Capitania do Porto de Setúbal: Praça da República, 2904-537 Setúbal · Tel: 265 548 270<br />
            Comando Local da Polícia Marítima: Tel: 265 105 123 / 918 498 049 / 918 849 050<br />
            E-mail: capitania.setubal@amn.pt<br />
            Emergências marítimas: Canal 16 VHF
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-700 text-foreground">10. Disposições Finais</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao efetuar uma reserva e utilizar os serviços da ValeJet, o utilizador declara ter lido, compreendido e aceite os presentes Termos e Condições na sua integralidade. A ValeJet reserva-se o direito de alterar os presentes termos, sendo as alterações comunicadas aos utilizadores através do website.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Os presentes Termos e Condições são regidos pela legislação portuguesa. Para resolução de litígios é competente o foro da comarca de Setúbal.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
