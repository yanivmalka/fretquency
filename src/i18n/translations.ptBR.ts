// Brazilian Portuguese (pt-BR) dictionary, keyed by the English source string
// like `he` in translations.ts. Addresses the player as "você". "Guitar" is
// rendered "Violão" (the word Brazilian learners use; "guitarra" reads as the
// electric guitar only). Landing in stages, mirroring Spanish stage 1: the app
// shell, settings, the drawer, the in-game screen, the Selector, Onboarding,
// Stats, the Leaderboard and the plan card. Everything not listed here falls
// back to English until a later stage adds it (see product-wishlist.md).

export const ptBR: Record<string, string> = {
  // Instrument / title
  'Guitar': 'Violão',
  'Bass': 'Baixo',
  'Fret Practice': 'Treino de trastes',

  // Instrument picker — roadmap instruments (admin-only "coming soon" tiles)
  'Coming soon': 'Em breve',
  'Ukulele': 'Ukulele',
  'Mandolin': 'Bandolim',
  'Banjo': 'Banjo',

  // Settings — section titles / labels / help
  'Instrument': 'Instrumento',
  'Playing': 'Prática',
  'Instruments': 'Instrumentos',
  'Strings': 'Cordas',
  'Frets': 'Trastes',
  'Type': 'Tipo',
  'Acoustic': 'Acústico',
  'Electric': 'Elétrico',
  'Soprano': 'Soprano',
  'Concert': 'Concerto',
  'Tenor': 'Tenor',
  'Baritone': 'Barítono',
  '5-String Standard': '5 cordas · padrão',
  '5-String Parlor': '5 cordas · parlor',
  '5-String Long Neck': '5 cordas · braço longo',
  '4-String Tenor (Irish, short scale)': '4 cordas · tenor (irlandês, escala curta)',
  '4-String Tenor': '4 cordas · tenor',
  '4-String Plectrum': '4 cordas · plectro',
  '6-String (Guitar-Banjo)': '6 cordas · banjo-violão',
  'Notes': 'Notas',
  'Switches tuning, string count and fret range, then reloads the note samples.':
    'Troca a afinação, o número de cordas e a extensão de trastes, e depois recarrega os sons das notas.',
  'Note names': 'Nomes das notas',
  'Written as': 'Escritas como',
  "Display only — the drill itself doesn't change.":
    'Só muda a exibição — o exercício continua igual.',
  'Solfège (Do Re Mi)': 'Solfejo (Dó Ré Mi)',
  'Letters (A, B, C…) or solfège syllables (Do, Re, Mi…).':
    'Letras (A, B, C…) ou sílabas de solfejo (Dó, Ré, Mi…).',
  'A sharp (♯) is a half-step higher; a flat (♭) is a half-step lower. The same pitch can be written either way — C♯ and D♭ are one note. Pick which sign you see.':
    'Um sustenido (♯) é meio tom acima; um bemol (♭) é meio tom abaixo. A mesma altura pode ser escrita dos dois jeitos — C♯ e D♭ são a mesma nota. Escolha qual sinal você quer ver.',
  'A dièse (♯) is a half-step higher; a bémol (♭) is a half-step lower. The same pitch can be written either way — Do♯ and Re♭ are one note. Pick which sign you see.':
    'Um sustenido (♯) é meio tom acima; um bemol (♭) é meio tom abaixo. A mesma altura pode ser escrita dos dois jeitos — Dó♯ e Ré♭ são a mesma nota. Escolha qual sinal você quer ver.',
  'Sharps or flats': 'Sustenidos ou bemóis',
  'Sharp (♯)': 'Sustenido (♯)',
  'Flat (♭)': 'Bemol (♭)',
  'Dièse (♯)': 'Sustenido (♯)',
  'Bémol (♭)': 'Bemol (♭)',
  'Score': 'Pontuação',
  'Score & celebrations': 'Pontuação e comemorações',
  'Live score, streak multiplier and celebrations are shown.':
    'A pontuação ao vivo, o multiplicador de sequência e as comemorações são exibidos.',
  'Every answer is still recorded to your stats and personal bests either way.':
    'De qualquer forma, cada resposta continua sendo salva nas suas estatísticas e recordes pessoais.',
  'On': 'Ligado',
  'Off': 'Desligado',
  'Silent mode': 'Modo silencioso',
  'Sound & vibration': 'Som e vibração',
  'Sound': 'Som',
  'Vibrate': 'Vibrar',
  'Silent': 'Silencioso',
  'How the drill answers back, on one ladder from quietest to loudest. Silent: no sound and no per-button buzz, just a buzz on right / wrong answers plus the on-screen celebrations. Vibrate: no sound — a buzz on every button press and on right / wrong answers instead. Sound 1–5: note playback, chimes and tap sounds, louder each step; the limiter keeps even the loudest from distorting. Silent and Vibrate are great for practising with headphones off or a guitar in hand.':
    'Como o exercício responde a você, numa escala do mais silencioso ao mais alto. Silencioso: sem som e sem vibração nos botões, só uma vibração nas respostas certas / erradas e as comemorações na tela. Vibrar: sem som — em vez disso, uma vibração a cada toque em botão e nas respostas certas / erradas. Som 1–5: a nota, os avisos e os sons de toque, mais altos a cada nível; o limitador evita distorção até no mais alto. Silencioso e Vibrar são ótimos para praticar sem fone ou com o violão na mão.',
  'Theme': 'Tema',
  'Dark': 'Escuro',
  'Night': 'Noite',
  'Day': 'Dia',
  'Night is a warmer, dimmer palette for a dark room. Day is a light palette.':
    'Noite é uma paleta mais quente e suave para um ambiente escuro. Dia é uma paleta clara.',
  'Appearance': 'Aparência',
  'Theme sets how light or dark the app is: Night is a warmer, dimmer palette for a dark room, Day is a light one. Season sets the colours layered over it — Winter is the original look. Auto follows your clock (Day from 07:00 to 19:00, Night after) and the real season where you are; picking a season by hand holds until that season ends.':
    'O tema define o quanto o app é claro ou escuro: Noite é uma paleta mais quente e suave para um ambiente escuro, e Dia é uma paleta clara. A estação define as cores aplicadas por cima — Inverno é o visual original. Automático segue o seu relógio (Dia das 07:00 às 19:00, Noite depois) e a estação real onde você está; se você escolher uma estação manualmente, ela vale até essa estação acabar.',
  'Season': 'Estação',
  'Winter': 'Inverno',
  'Spring': 'Primavera',
  'Summer': 'Verão',
  'Autumn': 'Outono',
  'A seasonal colour palette layered over the theme. Winter is the original look.':
    'Uma paleta de cores da estação aplicada sobre o tema. Inverno é o visual original.',
  'Mastery on the fretboard': 'Domínio no braço',
  'The per-note / per-fret accuracy bars drawn over the circle and grid while stopped or paused.':
    'As barras de precisão por nota / por traste desenhadas sobre o círculo e a grade quando o jogo está parado ou pausado.',
  'Mastery keeps being tracked and shows on the Stats screen either way.':
    'O domínio continua sendo registrado e aparece na tela de estatísticas de qualquer forma.',
  'Questions counted': 'Perguntas contadas',
  'How many of your most recent questions the mastery bars are computed from. Free accounts use the last 250.':
    'De quantas das suas perguntas mais recentes as barras de domínio são calculadas. Contas gratuitas usam as últimas 250.',
  'Choose how many recent questions the mastery bars are counted from':
    'Escolha de quantas perguntas recentes as barras de domínio são calculadas',
  'Mastery time window': 'Período do domínio',
  'Point the mastery bars at a recent-question count, a single day, or a date range':
    'Calcule as barras de domínio a partir de um número de perguntas recentes, de um único dia ou de um intervalo de datas',
  'What slice of your history the mastery bars are computed from. Free accounts use the last 250 questions. Older history saved without a date is not counted for a specific day or range.':
    'Qual parte do seu histórico é usada para calcular as barras de domínio. Contas gratuitas usam as últimas 250 perguntas. Histórico antigo salvo sem data não conta para um dia ou intervalo específico.',
  'Recent': 'Recentes',
  'A day': 'Um dia',
  'A range': 'Um intervalo',
  'From': 'De',
  'To': 'Até',
  'showing': 'mostrando',
  'showing last': 'mostrando as últimas',
  'showing all questions': 'mostrando todas as perguntas',
  'All': 'Tudo',
  'Stats & progress': 'Estatísticas e progresso',
  'Answer mode': 'Modo de resposta',
  'How you answer': 'Como você responde',
  'Voice mode asks for microphone permission the first time.':
    'O modo voz pede permissão para usar o microfone na primeira vez.',
  'Speak clearly and pause briefly between words — for sharp/flat notes, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Fale com clareza e faça uma pausa curta entre as palavras — para notas com sustenido/bemol, diga a letra, faça uma pausa e depois “sharp” / “flat” como duas palavras separadas.',
  'Tap': 'Toque',
  'Voice': 'Voz',
  'Play the target note on your guitar instead of tapping — the app listens through the microphone. Only works for “by fret” questions — a played note can’t say which string it came from, so “by note” questions stay on tap.':
    'Toque a nota pedida no seu violão em vez de tocar na tela — o app ouve pelo microfone. Só funciona nas perguntas “por traste” — uma nota tocada não diz de qual corda veio, então as perguntas “por nota” continuam no toque.',
  '🎸 Microphone blocked — enable it or switch to tap': '🎸 Microfone bloqueado — ative-o ou mude para toque',
  '🎸 Pitch detection isn’t available on this device — use tap': '🎸 A detecção de altura não está disponível neste aparelho — use o toque',
  '🎸 Didn’t catch that': '🎸 Não entendi',
  '🎸 Play the note on your guitar': '🎸 Toque a nota no seu violão',
  'Voice engine': 'Mecanismo de voz',
  'Auto picks the best available. Personal uses your calibrated profile; General uses the built-in model.':
    'Automático escolhe o melhor disponível. Pessoal usa o seu perfil calibrado; Geral usa o modelo embutido.',
  'Auto': 'Automático',
  'Personal': 'Pessoal',
  'General': 'Geral',
  'Your voice profile': 'Seu perfil de voz',
  'Calibrating your own voice improves recognition when answering by voice.':
    'Calibrar a sua própria voz melhora o reconhecimento ao responder por voz.',
  'recordings': 'gravações',
  'enabled': 'ativado',
  'Add / review recordings': 'Adicionar / revisar gravações',
  'Calibrate my voice': 'Calibrar minha voz',
  'Feedback board': 'Mural de sugestões',
  'Leaderboard': 'Ranking',
  'Account': 'Conta',
  'Signed in': 'Conectado',
  'Keeps your preferences and data in sync across devices.':
    'Mantém suas preferências e dados sincronizados entre aparelhos.',
  'Sign out': 'Sair',
  'Sign in with Google to keep your preferences and data across devices.':
    'Entre com o Google para manter suas preferências e dados em todos os seus aparelhos.',
  'Sign in with Google': 'Entrar com o Google',

  // Account → About tile + live community counts
  'About': 'Sobre',
  'Guitar Fret Practice is a small labor of love — built to turn learning the fretboard into a game instead of a chore. Made by an independent developer, with patient help from family and friends.':
    'Guitar Fret Practice é um pequeno projeto feito com carinho — criado para transformar o aprendizado do braço num jogo, e não numa obrigação. Feito por um desenvolvedor independente, com a ajuda paciente de família e amigos.',
  'Registered users': 'Usuários cadastrados',
  'Active now': 'Ativos agora',
  'Guests online': 'Visitantes online',
  'App update': 'Atualização do app',
  'A new version of the app is ready to install.': 'Uma nova versão do app está pronta para instalar.',
  'Update to version': 'Atualizar para a versão',
  'Downloading…': 'Baixando…',
  'Allow installs from this app in Android settings, then try again.': 'Permita instalações deste app nas configurações do Android e tente de novo.',
  'The update could not be installed. Check your connection and try again.': 'Não foi possível instalar a atualização. Verifique sua conexão e tente de novo.',
  'See the full list and what earns each one': 'Veja a lista completa e como ganhar cada uma',
  'Badges': 'Medalhas',
  'Language': 'Idioma',
  'Downloading the language…': 'Baixando o idioma…',
  'Could not download the language. Check your connection and try again.': 'Não foi possível baixar o idioma. Verifique sua conexão e tente de novo.',
  'Left-handed': 'Canhoto',
  'Seasonal background': 'Fundo da estação',
  'Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season': 'Flocos de neve, anêmonas, girassóis ou folhas caindo atrás do app, de acordo com a estação',
  'Light seasonal decorations behind the app: snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn. They follow the season above. Off keeps the background plain.':
    'Decorações leves da estação atrás do app: flocos de neve no inverno, anêmonas na primavera, girassóis no verão e folhas caindo no outono. Seguem a estação escolhida acima. Desligado deixa o fundo liso.',
  'Button depth': 'Relevo dos botões',
  'Gives the buttons a raised, 3D look: a light rim on top, a solid edge underneath, and they sink a little when pressed. Off keeps them flat.':
    'Dá aos botões um visual em relevo, 3D: uma borda clara em cima, uma borda sólida embaixo, e eles afundam um pouco ao serem pressionados. Desligado os mantém planos.',
  'Mirrors the app for a left-handed player: the fretboard flips (nut on the right), and the menu, Quick Access and back buttons move to the left. Independent of language — it stays mirrored in Hebrew too.':
    'Espelha o app para quem toca canhoto: o braço se inverte (pestana à direita) e o menu, o Acesso rápido e os botões de voltar vão para a esquerda. Independe do idioma — continua espelhado também em hebraico.',
  'Colour-blind heatmap markers': 'Marcas do mapa de calor para daltônicos',
  'Adds a ✓ / • mark on the Stats-screen fretboard heatmap cells, on top of colour, so known vs. needs-work reads without relying on hue.':
    'Adiciona uma marca ✓ / • nas células do mapa de calor do braço em Estatísticas, além da cor, para distinguir o que você domina do que precisa de treino sem depender da tonalidade.',

  // Hamburger drawer / dialogs
  'Settings': 'Configurações',
  'Close settings': 'Fechar configurações',
  'Open settings': 'Abrir configurações',
  'Game settings': 'Configurações do jogo',
  'Back': 'Voltar',
  'Microphone access': 'Acesso ao microfone',
  'Answer out loud': 'Responda em voz alta',
  'Voice mode listens for the note or fret you say instead of a tap.':
    'O modo voz escuta a nota ou o traste que você fala, em vez de um toque.',
  'Your browser will ask to use the microphone next — audio stays on your device and is never recorded or uploaded.':
    'Em seguida o seu navegador vai pedir para usar o microfone — o áudio fica no seu aparelho e nunca é gravado nem enviado.',
  'Allow microphone': 'Permitir microfone',
  'Not now': 'Agora não',
  'Microphone is blocked': 'O microfone está bloqueado',
  "Your browser is refusing microphone access for this site, so voice answers can't work yet. Tap the 🔒 / 🎤 icon beside the address bar, set the microphone to":
    'O seu navegador está bloqueando o microfone para este site, então as respostas por voz ainda não funcionam. Toque no ícone 🔒 / 🎤 ao lado da barra de endereço e defina o microfone como',
  ', then reload the page.': ', e depois recarregue a página.',
  'Allow': 'Permitir',
  'Got it': 'Entendi',
  'Use tap instead': 'Usar toque',
  'Sign in': 'Entrar',
  'Save your progress': 'Salve seu progresso',
  'Sign in to keep your history, badges and personal bests across devices. You can keep playing as a guest — everything still works, it just stays on this device.':
    'Entre para manter seu histórico, suas medalhas e seus recordes pessoais em todos os seus aparelhos. Você pode continuar jogando como visitante — tudo funciona igual, só fica salvo neste aparelho.',
  'Maybe later': 'Talvez depois',
  'Press back again to exit': 'Pressione voltar de novo para sair',

  // In-game
  'STAGE COMPLETE': 'FASE CONCLUÍDA',
  'Retry': 'Tentar de novo',
  '🎤 Microphone blocked — enable it or switch to tap': '🎤 Microfone bloqueado — ative-o ou mude para toque',
  '🎤 Voice needs a connection': '🎤 A voz precisa de conexão',
  '🎤 Voice isn’t working in this browser — try Chrome, or use tap':
    '🎤 A voz não funciona neste navegador — tente o Chrome ou use o toque',
  '🎤 Didn’t catch that': '🎤 Não entendi',
  'Round Complete!': 'Rodada concluída!',
  'Session Stopped': 'Sessão interrompida',
  "You're ready for the next stage:": 'Você está pronto para a próxima etapa:',
  "You've mastered this — ready to learn something new?": 'Você já domina isso — pronto para aprender algo novo?',
  'Move on': 'Avançar',
  'Explore Learn': 'Ir para Aprender',
  'pts': 'pts',
  'OK': 'OK',
  'Start': 'Começar',
  'Resume': 'Continuar',
  'Pause': 'Pausar',
  'Stop': 'Parar',
  'Refresh': 'Atualizar',
  'Privacy policy': 'Política de privacidade',

  'QUESTIONS': 'PERGUNTAS',
  'streak': 'sequência',
  'New badge': 'Nova medalha',
  'Badge upgraded': 'Medalha melhorada',
  'Continue': 'Continuar',
  'Listening…': 'Ouvindo…',
  'Member since': 'Membro desde',
  'badges earned': 'medalhas conquistadas',

  // Pinned badge shelf (Account section)
  'Choose badges to feature': 'Escolha medalhas para destacar',
  'Edit featured badges': 'Editar medalhas em destaque',
  'Your badges': 'Suas medalhas',
  'Feature up to 5 badges': 'Destaque até 5 medalhas',
  'Remove a badge to feature another.': 'Remova uma medalha para destacar outra.',
  'See all badges': 'Ver todas as medalhas',

  // LeaderboardPanel — standings sub-page
  'player': 'jogador',
  'players': 'jogadores',
  'ranked by XP': 'ordenado por XP',
  'free for everyone': 'grátis para todos',
  'All-time': 'Geral',
  'This week': 'Esta semana',
  'Loading…': 'Carregando…',
  'Couldn’t load the leaderboard. Check your connection and try again.':
    'Não foi possível carregar o ranking. Verifique sua conexão e tente de novo.',
  'Couldn’t update that. Check your connection and try again.':
    'Não foi possível atualizar. Verifique sua conexão e tente de novo.',
  'Your standing': 'Sua posição',
  'RANK': 'POSIÇÃO',
  'acc': 'prec.',
  '(you)': '(você)',
  'Hidden from the leaderboard': 'Oculto no ranking',
  'Visible on the leaderboard': 'Visível no ranking',
  'Join the board': 'Entre no ranking',
  'You can see every player’s standing right now. Sign in with Google to take your own place — every correct answer you’ve ever played counts. Free, no subscription.':
    'Você já pode ver a posição de cada jogador. Entre com o Google para ocupar o seu lugar — conta cada resposta certa que você já deu. Grátis, sem assinatura.',
  'No one’s on the board yet': 'Ainda não há ninguém no ranking',
  'Finish a practice run while signed in and your name lands here first.':
    'Termine uma sessão de prática conectado e o seu nome aparece aqui primeiro.',
  'How is XP counted?': 'Como o XP é contado?',

  // SelectorPanel — mode/difficulty/fret-range picker
  'all': 'todas as',
  'strings': 'cordas',
  'frets': 'trastes',
  'only the dot-marker frets': 'só os trastes com marcação',
  'natural notes only (no sharps or flats)': 'só notas naturais (sem sustenidos nem bemóis)',
  'every note, sharps and flats included': 'todas as notas, com sustenidos e bemóis',
  'alphabetical order': 'ordem alfabética',
  'circle-of-fifths order': 'ordem do ciclo de quintas',
  'A fret lights up and you pick its note from the wheel':
    'Um traste acende e você escolhe a nota dele na roda',
  ', rotated to the string': ', girada conforme a corda',
  'A note name is shown and you tap every fret on the neck where it lands.':
    'Aparece o nome de uma nota e você toca em cada traste do braço onde ela está.',
  'Note-by-Fret': 'Nota pelo traste',
  'Fret-by-Note': 'Traste pela nota',
  'Auto-advances through the difficulty stages.': 'Avança automaticamente pelos níveis de dificuldade.',
  'How this works': 'Como funciona',
  'neck': 'braço',
  'neck fret range selector': 'seletor da extensão de trastes do braço',
  'Precise fret range': 'Extensão de trastes precisa',
  'Pick an exact fret N–M window to drill': 'Escolha uma extensão exata de trastes N–M para treinar',
  'Fret range': 'Extensão de trastes',
  'Full only while a precise fret window is on': 'Só Completo enquanto houver uma extensão de trastes precisa',
  'Drill only part of the neck. Drag the handles to set the exact fret window — the shaded area is muted out, both here and on the home-screen neck.':
    'Treine só uma parte do braço. Arraste as alças para definir a extensão exata de trastes — a área sombreada fica de fora, tanto aqui quanto no braço da tela inicial.',
  'Lowest fret': 'Traste mais baixo',
  'Highest fret': 'Traste mais alto',
  'Multi': 'Várias',
  'Note by Fret': 'Nota pelo traste',
  'Alpha': 'Alfabética',
  'Fifths': 'Quintas',
  'By String': 'Por corda',
  'Fret by Note': 'Traste pela nota',
  "Read the note wheel like a clock: your open string sits at 12 o'clock, and the dots under each note show its fret. Answer before the timing bar empties.":
    'Leia a roda de notas como um relógio: a sua corda solta fica nas 12 horas, e os pontos sob cada nota mostram o traste dela. Responda antes que a barra de tempo se esvazie.',
  'Answer before the timing bar empties.': 'Responda antes que a barra de tempo se esvazie.',
  'Dots': 'Marcações',
  'Naturals': 'Naturais',
  'Full': 'Completo',
  'Auto Advance to next difficulty': 'Avanço automático para a próxima dificuldade',

  // Onboarding
  'Guitar Fret Practice': 'Guitar Fret Practice',
  'Master the fretboard with the clock method — one string at a time.':
    'Domine o braço com o método do relógio — uma corda de cada vez.',
  'What do you play?': 'O que você toca?',
  'Skip setup →': 'Pular configuração →',
  'How well do you know the fretboard?': 'Quanto você conhece o braço?',
  "I'm just starting": 'Estou começando',
  'Start with dot frets on String 6': 'Comece pelos trastes com marcação na corda 6',
  'I play but want to improve': 'Eu toco, mas quero melhorar',
  'Quick 3-question test': 'Teste rápido de 3 perguntas',
  'I know the full neck': 'Conheço o braço inteiro',
  'Jump right in': 'Começar já',
  'Skip →': 'Pular →',
  'String': 'Corda',
  'what note is fret': 'que nota é o traste',
  'Skip test →': 'Pular teste →',
  'Keep going!': 'Continue assim!',
  'Good start!': 'Bom começo!',
  'Nice work!': 'Muito bem!',
  'Impressive!': 'Impressionante!',
  'Dot Frets': 'Trastes com marcação',
  'Natural notes': 'Notas naturais',
  'the full chromatic neck': 'o braço cromático inteiro',
  "correct — we've set you up on": 'certas — configuramos você em',
  'Change it anytime in the selector panel.': 'Você pode mudar quando quiser no painel de seleção.',
  "Let's go →": 'Vamos lá →',

  // ProgressPanel — stats & progress screen
  'by note': 'por nota',
  'by fret': 'por traste',
  'fret': 'traste',
  'not played': 'não tocada',
  'known': 'dominada',
  'needs work': 'precisa treinar',
  'unplayed': 'não tocada',
  'Not enough data yet.': 'Ainda não há dados suficientes.',
  'Not practiced yet': 'Ainda não praticado',
  'Older sessions have no date stamp, so the timeline is empty. New sessions fill it in.':
    'As sessões antigas não têm data, então a linha do tempo está vazia. As sessões novas vão preenchê-la.',
  'Play a few rounds and your all-time progress shows up here.':
    'Jogue algumas rodadas e o seu progresso geral aparece aqui.',
  'accuracy': 'precisão',
  'day streak': 'dias seguidos',
  'answered': 'respondidas',
  'Weakest notes': 'Notas mais fracas',
  'Nothing below 70% — nice.': 'Nada abaixo de 70% — muito bem.',
  'By note': 'Por nota',
  'By string': 'Por corda',
  'By fret': 'Por traste',
  'Fretboard heatmap': 'Mapa de calor do braço',
  'Daily timeline': 'Linha do tempo diária',
  'Accuracy %': '% de precisão',
  'Avg response time': 'Tempo médio de resposta',
  'Personal bests': 'Recordes pessoais',
  'No personal bests recorded yet.': 'Ainda não há recordes pessoais.',
  'No practice in the last 7 days.': 'Nenhuma prática nos últimos 7 dias.',
  'All time': 'Geral',
  'Last 7 days': 'Últimos 7 dias',
  'across every': 'em cada',
  'settings combination': 'combinação de ajustes',
  'Clear all history': 'Apagar todo o histórico',
  'Clear all stats?': 'Apagar todas as estatísticas?',
  'This permanently erases your entire practice history and resets the all-time mastery for every note, string and settings combination. Your personal bests are kept.':
    'Isso apaga para sempre todo o seu histórico de prática e zera o domínio geral de cada nota, corda e combinação de ajustes. Seus recordes pessoais são mantidos.',
  "This can't be undone.": 'Não é possível desfazer.',
  'Delete anyway': 'Apagar mesmo assim',
  'Cancel': 'Cancelar',

  // Instrument string labels (guitar + bass, "String N · note")
  'String 1 · high E': 'Corda 1 · Mi agudo',
  'String 2 · B': 'Corda 2 · Si',
  'String 3 · G': 'Corda 3 · Sol',
  'String 4 · D': 'Corda 4 · Ré',
  'String 5 · A': 'Corda 5 · Lá',
  'String 6 · low E': 'Corda 6 · Mi grave',
  'String 1 · G': 'Corda 1 · Sol',
  'String 2 · D': 'Corda 2 · Ré',
  'String 3 · A': 'Corda 3 · Lá',
  'String 4 · low E': 'Corda 4 · Mi grave',

  // Free / Pro / Premium tiering — ProGate lock states + the Upgrade card
  'Premium': 'Premium',
  // Free-tier ad strip
  'Advertisement': 'Publicidade',
  'Ad': 'Anúncio',
  'Close ad': 'Fechar anúncio',
  'Your ad could be here. Go Pro to remove ads.': 'O seu anúncio poderia estar aqui. Assine o Pro para remover os anúncios.',
  'Unlock with Pro': 'Desbloquear com Pro',
  'Unlock with Premium': 'Desbloquear com Premium',
  'You have Pro': 'Você tem Pro',
  "You're on Free": 'Você está no plano gratuito',
  'Your plan': 'Seu plano',
  'Included with Pro': 'Incluído no Pro',
  'Everything in Free, plus:': 'Tudo do plano gratuito, e mais:',
  'Everything you need to practice daily, at no cost.':
    'Tudo o que você precisa para praticar todo dia, sem custo.',
  'The full fretboard drill — by note and by fret, on every string':
    'O exercício completo do braço — por nota e por traste, em todas as cordas',
  'Badges and achievements, with your pinned medal shelf':
    'Medalhas e conquistas, com a sua estante de medalhas em destaque',
  'The leaderboard — XP, questions answered and accuracy':
    'O ranking — XP, perguntas respondidas e precisão',
  'Cloud sync and full restore of your practice on every device':
    'Sincronização na nuvem e restauração completa da sua prática em todos os aparelhos',
  'Your last 7 days of stats, plus the personal best for what you’re drilling':
    'As suas estatísticas dos últimos 7 dias, mais o recorde pessoal do que você está treinando',
  'Free, forever': 'Grátis, para sempre',
  'Pro is for training seriously and tracking progress over time.':
    'O Pro é para treinar a sério e acompanhar o seu progresso ao longo do tempo.',
  'Your full practice history — all-time stats and trends, not just the last 7 days':
    'O seu histórico de prática completo — estatísticas e tendências gerais, não só dos últimos 7 dias',
  'Mastery maps — per-note and per-fret accuracy overlays on the circle and grid':
    'Mapas de domínio — precisão por nota e por traste sobre o círculo e a grade',
  'Browse your personal bests across every settings combination':
    'Consulte os seus recordes pessoais em cada combinação de ajustes',
  'A personal voice profile built from your own calibration recordings':
    'Um perfil de voz pessoal criado a partir das suas próprias gravações de calibração',
  'Your Pro access is complimentary.': 'O seu acesso Pro é uma cortesia.',
  'Your Pro access came from a promotion.': 'O seu acesso Pro veio de uma promoção.',
  'Your Pro access was granted manually.': 'O seu acesso Pro foi concedido manualmente.',
  'Your Pro access is from your subscription.': 'O seu acesso Pro vem da sua assinatura.',
  'Your Pro access is active.': 'O seu acesso Pro está ativo.',
  'It does not expire.': 'Não expira.',
  'Access runs until': 'O acesso vale até',
  'Pro isn’t on sale yet — everything above stays free to try in the meantime.':
    'O Pro ainda não está à venda — enquanto isso, você pode experimentar tudo acima de graça.',
  'Free': 'Grátis',

  // Adaptive difficulty suggestion banner (wishlist §3)
  'You’re cruising through this — ready for a harder level?':
    'Isso está fácil para você — pronto para um nível mais difícil?',
  'This setup is fighting back. Want to ease off a level?':
    'Esta configuração está difícil. Quer descer um nível?',
  'Switch the difficulty to': 'Mudar a dificuldade para',
  'Drop the difficulty to': 'Baixar a dificuldade para',
  'Apply': 'Aplicar',
  'Dismiss': 'Dispensar',

  // Learning-type navigation — the drawer's "Learn" group and its full pages
  'Learn': 'Aprender',
  'Choose what to practise.': 'Escolha o que praticar.',
  'Current': 'Atual',
  'Daily practice': 'Prática diária',
  'Intervals': 'Intervalos',
  'Scales': 'Escalas',
  'Chords': 'Acordes',
  'Staff reading': 'Leitura de partitura',
  'Game': 'Jogo',
  'Your daily plan is loading…': 'Carregando o seu plano diário…',
  'Let the Teacher plan your practice': 'Deixe o Professor planejar a sua prática',
  'Practise hearing and finding intervals': 'Pratique ouvir e encontrar intervalos',

  // Fret range conflict dialog
  'Fret range too small': 'Extensão de trastes pequena demais',
  'The current fret range': 'A extensão de trastes atual',
  ' allows fewer than ': ' permite menos de ',
  ' unique notes': ' notas diferentes',
  ' with the selected strings. Please expand the range.': ' com as cordas escolhidas. Amplie a extensão.',
  'Expand to minimum': 'Ampliar ao mínimo',
  'I will expand': 'Eu vou ampliar',
  'Custom range': 'Extensão personalizada',
  'Keep as is': 'Deixar assim',
  'Set fret range': 'Definir extensão de trastes',

  // ── Stage 2a: badges, guest merge, voice calibration, feedback board,
  // quick access and the tuner ──────────────────────────────────────────
  // Badges / Achievements wall — tiers
  'Bronze': 'Bronze',
  'Silver': 'Prata',
  'Gold': 'Ouro',
  'Platinum': 'Platina',
  'Diamond': 'Diamante',
  'Master': 'Mestre',
  'Legendary I': 'Lendário I',
  'Legendary II': 'Lendário II',
  'Legendary III': 'Lendário III',
  'Legendary IV': 'Lendário IV',
  // Wall chrome
  'unlocked': 'desbloqueadas',
  'Max': 'Máx.',
  'Earned': 'Conquistada',
  // Player profile card (leaderboard)
  'Achievements': 'Conquistas',
  'No badges earned yet.': 'Ainda nenhum emblema conquistado.',
  // Admin test controls
  'Grant': 'Conceder',
  'Reset': 'Redefinir',
  'Admin tools: Grant or Reset each badge to test it. History-based badges re-appear on reopen unless you also clear history.':
    'Ferramentas de administrador: conceda ou redefina cada medalha para testá-la. Medalhas baseadas no histórico reaparecem ao reabrir, a menos que você também apague o histórico.',
  // Family names
  'Perfect Session': 'Sessão perfeita',
  'Speed Demon': 'Demônio da velocidade',
  'Flawless Sprint': 'Sprint impecável',
  'On Fire': 'Pegando fogo',
  'Comeback': 'Virada',
  'Every String': 'Todas as cordas',
  'String Master': 'Mestre da corda',
  'String Master · {s}': 'Mestre · {s}',
  'Full String Master': 'Mestre de todas as cordas',
  'Neck Runner': 'Corredor do braço',
  'Both Ends': 'As duas pontas',
  'Low End': 'Região grave',
  'Week Warrior': 'Guerreiro da semana',
  'Dedicated': 'Dedicado',
  'Total Reps': 'Repetições totais',
  'Sharpshooter': 'Atirador de elite',
  'Quick Read': 'Leitura rápida',
  'Most Improved': 'Quem mais evoluiu',
  'Doubling Up': 'Em dobro',
  'Multi-Instrumentalist': 'Multi-instrumentista',
  'Admin': 'Administrador',
  // Earning conditions — Perfect Session
  'Answer 10+ questions in a round with no mistakes at all.':
    'Responda 10+ perguntas em uma rodada sem nenhum erro.',
  '25+ questions in a round, still zero mistakes.': '25+ perguntas em uma rodada, ainda sem nenhum erro.',
  '50+ questions in a round, still zero mistakes — a full clean run.':
    '50+ perguntas em uma rodada, ainda sem nenhum erro — uma rodada totalmente limpa.',
  // Speed Demon
  'Get 10+ correct answers in a round, at least 8 of them under 1.5s.':
    'Acerte 10+ respostas em uma rodada, pelo menos 8 delas em menos de 1,5 s.',
  '20+ correct answers, at least 16 of them under 1.5s.':
    '20+ respostas certas, pelo menos 16 delas em menos de 1,5 s.',
  '40+ correct answers, at least 32 of them under 1.2s.':
    '40+ respostas certas, pelo menos 32 delas em menos de 1,2 s.',
  // Flawless Sprint
  'Finish a whole round at 90% accuracy or better.':
    'Termine uma rodada inteira com 90% de precisão ou mais.',
  'Finish a whole round at 95% accuracy or better.':
    'Termine uma rodada inteira com 95% de precisão ou mais.',
  'Finish a whole round at 100% accuracy.': 'Termine uma rodada inteira com 100% de precisão.',
  // On Fire
  'Reach a streak of 15 in a single round.': 'Chegue a uma sequência de 15 em uma única rodada.',
  'Reach a streak of 20 in a single round.': 'Chegue a uma sequência de 20 em uma única rodada.',
  'Reach a streak of 30 in a single round.': 'Chegue a uma sequência de 30 em uma única rodada.',
  // Comeback
  'Miss 3+ of your first 20 questions, then answer the next 8 in a row correctly.':
    'Erre 3+ das suas primeiras 20 perguntas e depois acerte as 8 seguintes em sequência.',
  'Miss 5+ of your first 20 questions, then answer the next 12 in a row correctly.':
    'Erre 5+ das suas primeiras 20 perguntas e depois acerte as 12 seguintes em sequência.',
  'Miss 8+ of your first 20 questions, then answer the next 18 in a row correctly.':
    'Erre 8+ das suas primeiras 20 perguntas e depois acerte as 18 seguintes em sequência.',
  // Every String
  'Finish a round that visited every string: 2x that many questions, 90% accuracy.':
    'Termine uma rodada que passe por todas as cordas: o dobro de perguntas em relação ao número de cordas, 90% de precisão.',
  'Visited every string: 4x that many questions, 90% accuracy.':
    'Passando por todas as cordas: 4 vezes mais perguntas que cordas, 90% de precisão.',
  'Visited every string: 6x that many questions, 95% accuracy.':
    'Passando por todas as cordas: 6 vezes mais perguntas que cordas, 95% de precisão.',
  // Per-string String Master — {s} is the translated string label
  'Answer 40+ questions on {s} at 90% accuracy or better.':
    'Responda 40+ perguntas na {s} com 90% de precisão ou mais.',
  '100+ questions on {s} at 92% accuracy or better.': '100+ perguntas na {s} com 92% de precisão ou mais.',
  '200+ questions on {s} at 95% accuracy or better.': '200+ perguntas na {s} com 95% de precisão ou mais.',
  '400+ questions on {s} at 96% accuracy or better, over 14+ practice days.':
    '400+ perguntas na {s} com 96% de precisão ou mais, ao longo de 14+ dias de prática.',
  '800+ questions on {s} at 97% accuracy or better, over 30+ practice days.':
    '800+ perguntas na {s} com 97% de precisão ou mais, ao longo de 30+ dias de prática.',
  // Full String Master
  'Earn String Master — Bronze on every string of this instrument.':
    'Conquiste Mestre da corda — Bronze em todas as cordas deste instrumento.',
  'Earn String Master — Silver on every string.': 'Conquiste Mestre da corda — Prata em todas as cordas.',
  'Earn String Master — Gold on every string.': 'Conquiste Mestre da corda — Ouro em todas as cordas.',
  'Earn String Master — Platinum on every string.': 'Conquiste Mestre da corda — Platina em todas as cordas.',
  'Earn String Master — Diamond on every string.': 'Conquiste Mestre da corda — Diamante em todas as cordas.',
  // Neck Runner
  'Answer at least one question on every fret of the neck.':
    'Responda pelo menos uma pergunta em cada traste do braço.',
  'Answer at least 3 questions on every fret of the neck.':
    'Responda pelo menos 3 perguntas em cada traste do braço.',
  'Answer at least 5 questions on every fret of the neck.':
    'Responda pelo menos 5 perguntas em cada traste do braço.',
  'Answer at least 10 questions on every fret, spread across 14+ practice days.':
    'Responda pelo menos 10 perguntas em cada traste, distribuídas em 14+ dias de prática.',
  'Answer at least 20 questions on every fret, spread across 30+ practice days.':
    'Responda pelo menos 20 perguntas em cada traste, distribuídas em 30+ dias de prática.',
  // Both Ends
  'Answer 40+ questions above the 12th fret at 85% accuracy or better.':
    'Responda 40+ perguntas acima do traste 12 com 85% de precisão ou mais.',
  '100+ questions above the 12th fret at 88% accuracy or better.':
    '100+ perguntas acima do traste 12 com 88% de precisão ou mais.',
  '200+ questions above the 12th fret at 92% accuracy or better.':
    '200+ perguntas acima do traste 12 com 92% de precisão ou mais.',
  '400+ questions above the 12th fret at 93% accuracy or better, over 14+ practice days.':
    '400+ perguntas acima do traste 12 com 93% de precisão ou mais, ao longo de 14+ dias de prática.',
  '800+ questions above the 12th fret at 94% accuracy or better, over 30+ practice days.':
    '800+ perguntas acima do traste 12 com 94% de precisão ou mais, ao longo de 30+ dias de prática.',
  // Low End
  'Answer 40+ questions on the bass low-E string at 90% accuracy or better.':
    'Responda 40+ perguntas na corda Mi (E) grave do baixo com 90% de precisão ou mais.',
  '100+ questions on the low-E string at 93% accuracy or better.':
    '100+ perguntas na corda Mi (E) grave com 93% de precisão ou mais.',
  '200+ questions on the low-E string at 96% accuracy or better.':
    '200+ perguntas na corda Mi (E) grave com 96% de precisão ou mais.',
  '400+ questions on the low-E string at 97% accuracy or better, over 14+ practice days.':
    '400+ perguntas na corda Mi (E) grave com 97% de precisão ou mais, ao longo de 14+ dias de prática.',
  '800+ questions on the low-E string at 98% accuracy or better, over 30+ practice days.':
    '800+ perguntas na corda Mi (E) grave com 98% de precisão ou mais, ao longo de 30+ dias de prática.',
  // Week Warrior
  'Practise on 5 separate days within a single 7-day window.':
    'Pratique em 5 dias diferentes dentro de um mesmo período de 7 dias.',
  '6 separate days within a single 7-day window.': '6 dias diferentes dentro de um mesmo período de 7 dias.',
  'All 7 days within a single 7-day window — a perfect week.':
    'Todos os 7 dias de um mesmo período de 7 dias — uma semana perfeita.',
  // Dedicated
  'Build a run of 7 consecutive practice days.': 'Faça uma sequência de 7 dias de prática consecutivos.',
  '14 consecutive practice days.': '14 dias de prática consecutivos.',
  '30 consecutive practice days.': '30 dias de prática consecutivos.',
  '60 consecutive practice days.': '60 dias de prática consecutivos.',
  '90 consecutive practice days.': '90 dias de prática consecutivos.',
  '120 consecutive practice days.': '120 dias de prática consecutivos.',
  '180 consecutive practice days.': '180 dias de prática consecutivos.',
  '250 consecutive practice days.': '250 dias de prática consecutivos.',
  '300 consecutive practice days.': '300 dias de prática consecutivos.',
  '365 consecutive practice days — a full year, every day.':
    '365 dias de prática consecutivos — um ano inteiro, todos os dias.',
  // Total Reps
  'Answer 100 questions all-time, across every instrument.':
    'Responda 100 perguntas no total, somando todos os instrumentos.',
  '250 questions all-time.': '250 perguntas no total.',
  '500 questions all-time.': '500 perguntas no total.',
  '1,000 questions all-time.': '1.000 perguntas no total.',
  '2,500 questions all-time, spread across 20+ practice days.':
    '2.500 perguntas no total, distribuídas em 20+ dias de prática.',
  '5,000 questions all-time, spread across 40+ practice days.':
    '5.000 perguntas no total, distribuídas em 40+ dias de prática.',
  '10,000 questions all-time, spread across 70+ practice days.':
    '10.000 perguntas no total, distribuídas em 70+ dias de prática.',
  '20,000 questions all-time, spread across 110+ practice days.':
    '20.000 perguntas no total, distribuídas em 110+ dias de prática.',
  '35,000 questions all-time, spread across 160+ practice days.':
    '35.000 perguntas no total, distribuídas em 160+ dias de prática.',
  '50,000 questions all-time, spread across 220+ practice days.':
    '50.000 perguntas no total, distribuídas em 220+ dias de prática.',
  // Sharpshooter
  'Hold 85% accuracy over at least 200 questions, across every instrument.':
    'Mantenha 85% de precisão em pelo menos 200 perguntas, somando todos os instrumentos.',
  '88% accuracy over at least 500 questions.': '88% de precisão em pelo menos 500 perguntas.',
  '92% accuracy over at least 1,000 questions.': '92% de precisão em pelo menos 1.000 perguntas.',
  '93% accuracy over at least 2,500 questions, spread across 30+ practice days.':
    '93% de precisão em pelo menos 2.500 perguntas, distribuídas em 30+ dias de prática.',
  '94% accuracy over at least 5,000 questions, spread across 60+ practice days.':
    '94% de precisão em pelo menos 5.000 perguntas, distribuídas em 60+ dias de prática.',
  // Quick Read
  'Hold an average answer time under 2.0s over 200+ questions.':
    'Mantenha um tempo médio de resposta abaixo de 2,0 s em 200+ perguntas.',
  'Under 1.6s over 500+ questions.': 'Abaixo de 1,6 s em 500+ perguntas.',
  'Under 1.3s over 1,000+ questions.': 'Abaixo de 1,3 s em 1.000+ perguntas.',
  'Under 1.15s over 2,500+ questions, spread across 30+ practice days.':
    'Abaixo de 1,15 s em 2.500+ perguntas, distribuídas em 30+ dias de prática.',
  'Under 1.05s over 5,000+ questions, spread across 60+ practice days.':
    'Abaixo de 1,05 s em 5.000+ perguntas, distribuídas em 60+ dias de prática.',
  // Most Improved
  'Over 10+ practice days, lift your accuracy by 20 points from your first days to your latest.':
    'Ao longo de 10+ dias de prática, aumente sua precisão em 20 pontos dos primeiros dias até os mais recentes.',
  'Over 15+ practice days, lift your accuracy by 30 points.':
    'Ao longo de 15+ dias de prática, aumente sua precisão em 30 pontos.',
  'Over 20+ practice days, lift your accuracy by 40 points.':
    'Ao longo de 20+ dias de prática, aumente sua precisão em 40 pontos.',
  // Doubling Up
  'Earn String Master on every string of both guitar and bass.':
    'Conquiste Mestre da corda em todas as cordas, tanto no violão quanto no baixo.',
  'Earn Full String Master — Silver on both guitar and bass.':
    'Conquiste Mestre de todas as cordas — Prata, tanto no violão quanto no baixo.',
  'Earn Full String Master — Gold and Neck Runner — Gold on both guitar and bass.':
    'Conquiste Mestre de todas as cordas — Ouro e Corredor do braço — Ouro, tanto no violão quanto no baixo.',
  'Earn Full String Master — Platinum and Neck Runner — Platinum on both guitar and bass.':
    'Conquiste Mestre de todas as cordas — Platina e Corredor do braço — Platina, tanto no violão quanto no baixo.',
  'Earn Full String Master — Diamond and Neck Runner — Diamond on both guitar and bass.':
    'Conquiste Mestre de todas as cordas — Diamante e Corredor do braço — Diamante, tanto no violão quanto no baixo.',
  // Multi-Instrumentalist
  'Earn Full String Master — Silver on 2 different instruments.':
    'Conquiste Mestre de todas as cordas — Prata em 2 instrumentos diferentes.',
  'Earn Full String Master — Silver on 3 different instruments.':
    'Conquiste Mestre de todas as cordas — Prata em 3 instrumentos diferentes.',
  'Earn Full String Master — Gold on 4 different instruments.':
    'Conquiste Mestre de todas as cordas — Ouro em 4 instrumentos diferentes.',
  'Earn Full String Master — Gold on all 5 instruments.':
    'Conquiste Mestre de todas as cordas — Ouro nos 5 instrumentos.',
  'Earn Full String Master — Platinum on all 5 instruments.':
    'Conquiste Mestre de todas as cordas — Platina nos 5 instrumentos.',
  // Admin (role)
  'Granted to app administrators — read every Feedback board post, not just your own.':
    'Concedida aos administradores do app — permite ler todas as publicações do mural de sugestões, não só as suas.',
  // Guest-merge prompt — first sign-in on a device with local guest history
  'Add this device’s progress to your account?': 'Adicionar o progresso deste aparelho à sua conta?',
  'You’ve practiced on this device without an account. Add that progress to your account, or keep only what’s already on your account?':
    'Você praticou neste aparelho sem uma conta. Quer adicionar esse progresso à sua conta ou manter só o que já está nela?',
  'Merge my progress': 'Juntar meu progresso',
  'Use account only': 'Usar só a conta',
  'Leave this practice off your account?': 'Deixar esta prática fora da sua conta?',
  'You have {n} rounds of practice saved on this device. If you continue, they stay on this device but are not added to your account.':
    'Você tem {n} rodadas de prática salvas neste aparelho. Se continuar, elas ficam neste aparelho, mas não são adicionadas à sua conta.',
  // VoiceCalibration
  'Voice calibration': 'Calibração de voz',
  'Personal voice calibration': 'Calibração de voz pessoal',
  'Profile name': 'Nome do perfil',
  'Say just this word, on its own': 'Diga só esta palavra, sozinha',
  'Say just the note name, on its own': 'Diga só o nome da nota, sozinho',
  'Speak clearly and pause briefly between words — later, when answering, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Fale com clareza e faça uma breve pausa entre as palavras — depois, ao responder, diga a letra, faça uma pausa e então “sharp” / “flat” como duas palavras separadas.',
  'Could not use the microphone — try again': 'Não foi possível usar o microfone — tente de novo',
  'No sound captured — try again, closer to the mic':
    'Nenhum som captado — tente de novo, mais perto do microfone',
  'Recording too short — try again': 'Gravação curta demais — tente de novo',
  "That didn't sound like a note — try again": 'Isso não pareceu uma nota — tente de novo',
  'Saving the recording failed': 'Não foi possível salvar a gravação',
  'Recorded': 'Gravadas',
  'notes': 'notas',
  'accidentals': 'acidentes',
  'Say:': 'Diga:',
  'Play last recording': 'Tocar a última gravação',
  'Export recordings to a folder (dev)': 'Exportar gravações para uma pasta (dev)',
  'Stop exporting recordings': 'Parar de exportar gravações',
  'Every accepted take is also saved as a WAV, named for scripts/eval-voice.mts.':
    'Cada take aceito também é salvo como WAV, com o nome que scripts/eval-voice.mts espera.',
  'Could not write to the export folder — pick it again':
    'Não foi possível gravar na pasta de exportação — escolha-a de novo',
  'Speak the word on screen — calibration advances on its own':
    'Diga a palavra que aparece na tela — a calibração avança sozinha',
  'Take': 'Take',
  'Previous': 'Anterior',
  'Next': 'Próximo',
  'Delete profile': 'Apagar perfil',
  'Reset automatic learning of the general mode': 'Redefinir o aprendizado automático do modo geral',
  'Checking recordings…': 'Verificando gravações…',
  'Self-test recordings': 'Autoteste das gravações',
  'All words are distinct enough — looks good.': 'Todas as palavras são distintas o bastante — tudo certo.',
  'Finish & enable': 'Concluir e ativar',
  '“{a}” and “{b}” sound very similar — re-record one of them.':
    '“{a}” e “{b}” soam parecidos demais — grave um deles de novo.',
  'Recording extra takes to tell “{a}” and “{b}” apart':
    'Gravando takes extras para distinguir “{a}” de “{b}”',
  'No recordings for “{prompt}” yet': 'Ainda não há gravações de “{prompt}”',
  'Delete take {n} of {prompt}': 'Apagar o take {n} de {prompt}',
  'Record {n} more takes for “{a}” and “{b}”': 'Gravar mais {n} takes de “{a}” e “{b}”',
  'to go': 'restantes',
  // VoiceLevelMeter
  'Microphone level good': 'Nível do microfone bom',
  'Microphone level low, speak louder': 'Nível do microfone baixo, fale mais alto',
  'Good level': 'Nível bom',
  'Too quiet — speak up': 'Baixo demais — fale mais alto',
  // DebugLogPanel
  'Debug log': 'Registro de depuração',
  'Open debug log': 'Abrir registro de depuração',
  'Errors + voice · auto-clears daily': 'Erros + voz · limpa sozinho todo dia',
  'Errors · auto-clears daily': 'Erros · limpa sozinho todo dia',
  'Voice: on': 'Voz: ligada',
  'Voice: off': 'Voz: desligada',
  'Copied': 'Copiado',
  'Copy': 'Copiar',
  'Clear': 'Limpar',
  'Close': 'Fechar',
  '(no errors)': '(sem erros)',
  // FeedbackBoard
  'Couldn’t load the board. Check your connection and try again.':
    'Não foi possível carregar o mural. Verifique sua conexão e tente de novo.',
  'Couldn’t send that. Check your connection and try again.':
    'Não foi possível enviar. Verifique sua conexão e tente de novo.',
  'Sign in with Google to leave a comment, idea, or suggestion. Only admins can read the full board.':
    'Entre com o Google para deixar um comentário, uma ideia ou uma sugestão. Só os administradores podem ler o mural inteiro.',
  'Microphone access is off — turn it on to dictate.':
    'O acesso ao microfone está desligado — ative-o para ditar.',
  'Voice typing isn’t available on this device.': 'A digitação por voz não está disponível neste aparelho.',
  'Couldn’t hear that — try again.': 'Não deu para ouvir — tente de novo.',
  'What’s on your mind?': 'O que você quer nos contar?',
  'Stop voice typing': 'Parar a digitação por voz',
  'Start voice typing': 'Iniciar a digitação por voz',
  'Sending…': 'Enviando…',
  'Send': 'Enviar',
  'Listening… say one sentence — it stops on its own.': 'Ouvindo… diga uma frase — para sozinho.',
  'Thanks — your message was sent.': 'Obrigado — sua mensagem foi enviada.',
  'Unknown': 'Desconhecido',
  'You': 'Você',
  'Handled': 'Resolvido',
  'Mark unhandled': 'Marcar como pendente',
  'Mark handled': 'Marcar como resolvido',
  'Delete': 'Apagar',
  'You haven’t sent anything yet.': 'Você ainda não enviou nada.',
  'Share a comment, idea, or suggestion. Admins read every post; below you can see the ones you’ve sent.':
    'Compartilhe um comentário, uma ideia ou uma sugestão. Os administradores leem todas as publicações; abaixo você vê as que enviou.',
  'Write': 'Escrever',
  'Inbox': 'Caixa de entrada',
  'Post a comment, idea, or suggestion of your own.': 'Publique seu próprio comentário, ideia ou sugestão.',
  'Every post from every user': 'Todas as publicações de todos os usuários',
  'still to handle': 'pendentes',
  'Mark one handled once you’ve dealt with it, or delete it.':
    'Marque uma como resolvida depois de tratá-la, ou apague-a.',
  'No posts yet.': 'Ainda não há publicações.',
  'Nothing open — all caught up.': 'Nada pendente — tudo em dia.',
  'Delete post': 'Apagar publicação',
  'Delete this post?': 'Apagar esta publicação?',
  'This permanently removes it for everyone, including': 'Isso a remove de vez para todos, inclusive',
  'the author': 'o autor',
  'It can’t be undone.': 'Não é possível desfazer.',
  'Delete for everyone': 'Apagar para todos',
  // Quick Access — the floating home-screen control, its Settings row and pushpins
  'Quick access': 'Acesso rápido',
  'A floating button on the home screen for the settings you flip most. Pin up to 5 with the pushpins below, then double-tap the lower-right of the screen outside a drill to open it.':
    'Um botão flutuante na tela inicial para as configurações que você mais troca. Fixe até 5 com os alfinetes abaixo e depois toque duas vezes no canto inferior direito da tela, fora de um exercício, para abri-lo.',
  'Pin to quick access?': 'Fixar no acesso rápido?',
  'Remove from quick access?': 'Remover do acesso rápido?',
  'You can pin up to {n} settings. Remove one first.':
    'Você pode fixar até {n} configurações. Remova uma primeiro.',
  'Quick access is full': 'O acesso rápido está cheio',
  'You already have {n} shortcuts. Remove one to make room?':
    'Você já tem {n} atalhos. Remover um para abrir espaço?',
  'Remove one': 'Remover um',
  'Leave as is': 'Deixar como está',
  'Remove a quick access shortcut': 'Remover um atalho do acesso rápido',
  'Quick access holds five shortcuts. Remove one to make room.':
    'O acesso rápido comporta cinco atalhos. Remova um para abrir espaço.',
  'Remove {name} from quick access': 'Remover {name} do acesso rápido',
  'Yes': 'Sim',
  'No': 'Não',
  'Double-tap the lower-right of the screen for quick access':
    'Toque duas vezes no canto inferior direito da tela para o acesso rápido',
  'Double-tap the lower-left of the screen for quick access':
    'Toque duas vezes no canto inferior esquerdo da tela para o acesso rápido',
  'Quick access is off': 'O acesso rápido está desligado',
  "You haven't pinned any quick access shortcuts yet": 'Você ainda não fixou nenhum atalho no acesso rápido',
  'What do the icons mean?': 'O que os ícones significam?',
  'Quick access symbol legend': 'Legenda dos símbolos do acesso rápido',
  'What each icon on the Quick Access widget means. Tapping a pinned shortcut cycles through these states in order.':
    'O que cada ícone do acesso rápido significa. Tocar em um atalho fixado alterna entre estes estados, nesta ordem.',
  'Letters (A B C)': 'Letras (A B C)',
  'Sharps (♯)': 'Sustenidos (♯)',
  'Flats (♭)': 'Bemóis (♭)',
  // Tuner — the Learn-tab tile that opens a live chromatic tuner
  'Tuner': 'Afinador',
  'Tune your strings using the microphone.': 'Afine suas cordas usando o microfone.',
  'Start listening': 'Começar a ouvir',
  'Requesting microphone permission…': 'Pedindo permissão para o microfone…',
  'Microphone access was denied. Allow it in your browser settings, then try again.':
    'O acesso ao microfone foi negado. Permita-o nas configurações do navegador e tente de novo.',
  'Try again': 'Tentar de novo',
  "Couldn't start the microphone.": 'Não foi possível ligar o microfone.',
  'Listening… play a note.': 'Ouvindo… toque uma nota.',
  "Tap a note on the wheel to lock it as the string you're tuning. Tap it again to switch back to auto-detect.":
    'Toque em uma nota da roda para fixá-la como a corda que você está afinando. Toque de novo para voltar à detecção automática.',
  'Tuning': 'Afinando',
  'Detected': 'Detectada',
  'String {n}': 'Corda {n}',
  'or': 'ou',
  'Unpin': 'Soltar',
  "Tap to lock this note at 12 o'clock": 'Toque para fixar esta nota no alto, às 12 horas',
  'Tap to unpin': 'Toque para soltar',
  'In tune': 'Afinada',
  'Tighten (raise pitch)': 'Aperte (suba a afinação)',
  'Loosen (lower pitch)': 'Afrouxe (desça a afinação)',
  '~{pct}% of the audible threshold': '~{pct}% do limiar audível',

  // ── Stage 2b: the Premium Learn areas (Teacher, Learning Path, intervals,
  // scales, staff and tab reading) and the admin / dev-panel copy ─────────
  // Admin-only account tools and the dev debug panel
  'Admin: plan on your account': 'Admin: plano da sua conta',
  'Sets the plan on your own account only (Free, Pro or Premium). Writes to the entitlements table and syncs across your devices.':
    'Define o plano só da sua própria conta (Grátis, Pro ou Premium). Grava na tabela de direitos e sincroniza entre seus aparelhos.',
  'Simulate tier (dev only — no DB change)':
    'Simular plano (só desenvolvimento — sem mudar o banco de dados)',
  'Admin: view the app as': 'Admin: ver o app como',
  'Hides every admin-only control so you see exactly what a regular user sees. Switch back here any time — this is a local view change only and does not change what your account can do.':
    'Oculta todos os controles de administrador para você ver exatamente o que um usuário comum vê. Volte aqui quando quiser — é só uma mudança de visualização local e não muda o que sua conta pode fazer.',
  'Regular user': 'Usuário comum',
  // Premium Teacher — the Today card
  'Teacher': 'Professor',
  'Today with your Teacher': 'Hoje com o seu Professor',
  'Recommended': 'Recomendado',
  'positions': 'posições',
  "Today's goal is done": 'Meta de hoje cumprida',
  'one more round?': 'mais uma rodada?',
  'Daily goal': 'Meta diária',
  "Start today's practice": 'Começar a prática de hoje',
  'Practise my weak spots': 'Praticar meus pontos fracos',
  'No weak spots yet — keep practising and the Teacher will find them.':
    'Ainda não há pontos fracos — continue praticando e o Professor vai encontrá-los.',
  'Why these?': 'Por que estas?',
  'Hide why': 'Ocultar o porquê',
  'due for review': 'para revisar',
  'weak spots': 'pontos fracos',
  'to reinforce': 'para reforçar',
  'new ground': 'terreno novo',
  'a fresh set to get started': 'um conjunto novo para começar',
  'often missed': 'errada com frequência',
  'slow to recall': 'lenta para lembrar',
  'recent slips': 'erros recentes',
  'reinforcement': 'reforço',
  'not practised much': 'pouco praticada',
  'review': 'revisão',
  // Premium Learning Path — the Path screen
  'Learning Path': 'Trilha de aprendizado',
  'View your Learning Path': 'Ver sua trilha de aprendizado',
  'Follow a guided path from single notes onward': 'Siga uma trilha guiada a partir de notas soltas',
  'A guided journey through the fretboard. Practise from the Selector whenever you like — your answers still move you along this path.':
    'Uma jornada guiada pelo braço. Pratique pelo seletor quando quiser — suas respostas continuam fazendo você avançar nesta trilha.',
  'Practise toward this checkpoint': 'Praticar para este ponto de controle',
  'This is your next step.': 'Este é o seu próximo passo.',
  'Every checkpoint mastered — keep it sharp.': 'Todos os pontos de controle dominados — mantenha a forma.',
  'mastered': 'dominado',
  'Locked': 'Bloqueado',
  // Premium interval training — the P4 interval drill
  'Interval training': 'Treino de intervalos',
  'Hear and find the distance between two notes.': 'Ouça e encontre a distância entre duas notas.',
  'intervals tracked': 'intervalos acompanhados',
  '1 interval tracked': '1 intervalo acompanhado',
  'Answer form': 'Forma de resposta',
  'Find it on the neck': 'Encontrá-la no braço',
  'Name the note': 'Nomear a nota',
  'Start interval practice': 'Começar a prática de intervalos',
  'above': 'acima de',
  // Premium scale training
  'Scale training': 'Treino de escalas',
  'Practise building scale shapes on the neck': 'Pratique montar desenhos de escalas no braço',
  'Rows of notes fall down the screen, one lane per string. Only the first note of the scale is lit — tap it, and the distance in tones to the next note appears on it. Find that next note before its row falls off, bottom row first — a run up or down the scale, as the arrow on the banner shows. Every note you tap plays its sound.':
    'Fileiras de notas descem pela tela, uma pista por corda. Só a primeira nota da escala fica acesa — toque nela e a distância em tons até a próxima nota aparece sobre ela. Encontre essa próxima nota antes que a fileira saia da tela, começando pela fileira de baixo — uma corrida subindo ou descendo a escala, como mostra a seta no aviso. Cada nota que você toca soa.',
  'Tones to the next note': 'Tons até a próxima nota',
  'The next note is on another string': 'A próxima nota está em outra corda',
  'Frets to the next note': 'Trastes até a próxima nota',
  'Distance shown in': 'Distância em',
  'Tones': 'Tons',
  'A half tone is one fret, a whole tone is two.': 'Um semitom é um traste; um tom inteiro, dois.',
  'Question': 'Pergunta',
  'Scale': 'Escala',
  'Session complete!': 'Sessão concluída!',
  'Practice again': 'Praticar de novo',
  'Build the scale': 'Monte a escala',
  'Tap the scale in order': 'Toque a escala em ordem',
  'A section of the neck is shown with every note of the scale lit. Tap them in order to play the scale: start on the root (gold ring), go to one end of the section, then to the other end, and back to the root — up first or down first, as the arrow shows.':
    'Uma parte do braço aparece com todas as notas da escala acesas. Toque nelas em ordem para tocar a escala: comece na tônica (anel dourado), vá até uma ponta da parte, depois até a outra, e volte à tônica — subindo primeiro ou descendo primeiro, como mostra a seta.',
  'Connect the boxes': 'Conecte os desenhos',
  'Boxes 1–2': 'Desenhos 1–2',
  'A wider section of the neck is shown, spanning box 1 and box 2 of the scale together. Tap the notes in order to play a run that crosses from one box into the next and back — the same rules as "Tap the scale in order".':
    'Uma parte mais larga do braço aparece, unindo o desenho 1 e o desenho 2 da escala. Toque as notas em ordem para tocar uma sequência que passa de um desenho para o outro e volta — as mesmas regras de "Toque a escala em ordem".',
  'Learning mode': 'Modo de aprendizado',
  'Play on my own': 'Tocar sozinho',
  'Watch, then play': 'Assistir e depois tocar',
  'The app plays each scale first, lighting its notes one by one — then you play it after.':
    'O app toca cada escala primeiro, acendendo as notas uma a uma — depois é a sua vez de tocar.',
  'Watch and listen…': 'Assista e ouça…',
  'Your turn — play it back': 'Sua vez — toque de volta',
  // Task A — Scales Recall mode ("play the box from memory").
  'Play from memory': 'Tocar de memória',
  'All notes lit': 'Todas as notas acesas',
  'Only the root lit': 'Só a tônica acesa',
  'Empty neck': 'Braço vazio',
  'Every note of the box is lit — learn the shape by seeing it.': 'Todas as notas do desenho estão acesas — aprenda a forma vendo-a.',
  'Only the root is lit. Play the rest of the box from memory — a dim note of the box still counts.':
    'Só a tônica está acesa. Toque o resto do desenho de memória — uma nota apagada do desenho também conta.',
  'Nothing is lit. Find the root and play the whole box from memory.': 'Nada está aceso. Encontre a tônica e toque o desenho inteiro de memória.',
  'Move up a level by itself after 3 good runs in a row': 'Subir de nível sozinho após 3 escalas bem tocadas seguidas',
  'Good runs toward the next level:': 'Escalas bem tocadas para o próximo nível:',
  'Level up — the neck is empty now': 'Você subiu de nível — agora o braço está vazio',
  'Level up — only the root is lit now': 'Você subiu de nível — agora só a tônica está acesa',
  'Play the scale on your guitar, note by note — the app listens through the microphone. A note an octave higher or lower also counts. Tapping still works.':
    'Toque a escala no seu violão, nota por nota — o app ouve pelo microfone. Uma nota uma oitava acima ou abaixo também conta. Tocar na tela continua funcionando.',
  '🎸 Play the scale on your guitar': '🎸 Toque a escala no seu violão',
  'Identify the scale': 'Identifique a escala',
  'Name the degree': 'Diga o grau',
  'The app plays the scale up or down. Pick which scale you heard.':
    'O app toca a escala subindo ou descendo. Escolha qual escala você ouviu.',
  'The app shows a scale, a root and a degree. Pick the note that matches.':
    'O app mostra uma escala, uma tônica e um grau. Escolha a nota correspondente.',
  '🔊 hear it again': '🔊 ouvir de novo',
  'Minor Pentatonic': 'Pentatônica menor',
  'Major': 'Maior',
  'Natural Minor': 'Menor natural',
  'Major Pentatonic': 'Pentatônica maior',
  'Blues': 'Blues',
  'Harmonic Minor': 'Menor harmônica',
  'Melodic Minor': 'Menor melódica',
  'Dorian': 'Dórico',
  'Phrygian': 'Frígio',
  'Lydian': 'Lídio',
  'Mixolydian': 'Mixolídio',
  'Locrian': 'Lócrio',
  'Phrygian Dominant (Hijaz)': 'Frígio dominante (Hijaz)',
  'Major Blues': 'Blues maior',
  'Half-Whole Diminished': 'Diminuta semitom-tom',
  'Whole-Half Diminished': 'Diminuta tom-semitom',
  'Whole Tone': 'Tons inteiros',
  'Lydian Dominant (Acoustic)': 'Lídio dominante (acústica)',
  'Altered (Super Locrian)': 'Alterada (superlócrio)',
  'Double Harmonic (Arabic)': 'Dupla harmônica (árabe)',
  'Hungarian Minor (Gypsy Minor)': 'Menor húngara (menor cigana)',
  'Hirajoshi': 'Hirajoshi',
  'All scales': 'Todas as escalas',
  'More scales': 'Mais escalas',
  'Modes': 'Modos',
  'Minor variations': 'Variações menores',
  'Blues & jazz': 'Blues e jazz',
  'World': 'Do mundo',
  'Other': 'Outras',
  // "?" explanations on the More scales page (src/utils/scaleBlurbs.ts)
  "Each number is a note's place in the scale, counted from the starting note (1).":
    'Cada número é o lugar de uma nota na escala, contando a partir da nota inicial (1).',
  'Pick a starting note to see the scale on it:': 'Escolha uma nota inicial para ver a escala a partir dela:',
  'Highlighted numbers differ from the major scale: b means one fret lower, # means one fret higher.':
    'Os números destacados diferem da escala maior: b significa um traste abaixo, # um traste acima.',
  'Like natural minor, but with a major 6th instead of a flat 6th. It sounds minor yet lighter and more open — common in funk, jazz and rock.':
    'Como a menor natural, mas com uma 6ª maior em vez de uma 6ª bemol. Soa menor, porém mais leve e aberta — comum no funk, no jazz e no rock.',
  'Like natural minor, but the 2nd note sits just one fret above the root. It sounds dark and tense, with a Spanish flavour — common in flamenco and metal.':
    'Como a menor natural, mas a 2ª nota fica só um traste acima da tônica. Soa escura e tensa, com sabor espanhol — comum no flamenco e no metal.',
  'Like the major scale, but with a raised 4th. It sounds bright, dreamy and floating — common in film music.':
    'Como a escala maior, mas com a 4ª elevada. Soa brilhante, sonhadora e flutuante — comum em trilhas de cinema.',
  'Like the major scale, but with a flat 7th. It sounds relaxed and bluesy — common in rock, blues and folk.':
    'Como a escala maior, mas com a 7ª bemol. Soa relaxada e com cara de blues — comum no rock, no blues e no folk.',
  'The most unstable of the modes: it has both a flat 2nd and a flat 5th. It is rarely used as a home key and mostly heard over half-diminished chords.':
    'O mais instável dos modos: tem a 2ª bemol e a 5ª bemol. Quase nunca é usado como tonalidade principal e aparece sobretudo sobre acordes meio-diminutos.',
  'Natural minor with a raised 7th, so the 7th sits one fret below the root. That gives a strong pull back home and a dramatic, classical sound.':
    'Menor natural com a 7ª elevada, então a 7ª fica um traste abaixo da tônica. Isso dá uma forte atração de volta para casa e um som dramático e clássico.',
  'A minor scale (flat 3rd) that keeps the major 6th and 7th. It sounds smooth and jazzy.':
    'Uma escala menor (3ª bemol) que mantém a 6ª e a 7ª maiores. Soa suave e jazzística.',
  'Harmonic minor with a raised 4th. It has two wide gaps of a step and a half, which gives it a dramatic, exotic sound.':
    'Menor harmônica com a 4ª elevada. Tem dois saltos largos de um tom e meio, que dão a ela um som dramático e exótico.',
  'The major pentatonic scale plus the flat 3rd "blue note". It sounds sunny, with a country and blues feel.':
    'A pentatônica maior mais a "blue note" da 3ª bemol. Soa ensolarada, com clima de country e blues.',
  'A major scale with a raised 4th and a flat 7th. It sounds bright but bluesy, and jazz players use it over dominant 7th chords.':
    'Uma escala maior com a 4ª elevada e a 7ª bemol. Soa brilhante, mas com cara de blues, e músicos de jazz a usam sobre acordes de sétima dominante.',
  'It bends every colour note of a dominant chord: it has both a flat and a raised 2nd, and both a flat and a raised 5th. It sounds very tense, and is played right before resolving to the next chord.':
    'Altera todas as notas de cor de um acorde dominante: tem a 2ª bemol e a 2ª elevada, e a 5ª bemol e a 5ª elevada. Soa muito tensa e é tocada logo antes de resolver no acorde seguinte.',
  'Eight notes, alternating a half step and a whole step. It is symmetrical and tense, and jazz players use it over dominant 7th chords.':
    'Oito notas alternando semitom e tom. É simétrica e tensa, e músicos de jazz a usam sobre acordes de sétima dominante.',
  'Eight notes, alternating a whole step and a half step. It is symmetrical, and is used over diminished chords.':
    'Oito notas alternando tom e semitom. É simétrica e usada sobre acordes diminutos.',
  'Six notes, every step a whole tone. With no half steps it has no clear home note, so it sounds dreamy and floating.':
    'Seis notas, cada passo um tom inteiro. Sem semitons, não tem uma nota de repouso clara, então soa sonhadora e flutuante.',
  'Phrygian with a major 3rd. It is the classic Middle-Eastern sound, common in flamenco, klezmer and Arabic music.':
    'Frígio com a 3ª maior. É o som clássico do Oriente Médio, comum no flamenco, no klezmer e na música árabe.',
  'A major-sounding scale with a flat 2nd and a flat 6th, so it has two gaps of a step and a half. It has a rich Middle-Eastern flavour.':
    'Uma escala de som maior com a 2ª e a 6ª bemóis, então tem dois saltos de um tom e meio. Tem um rico sabor do Oriente Médio.',
  'A five-note Japanese scale with wide gaps between its notes. It sounds sparse and haunting, like a koto.':
    'Uma escala japonesa de cinco notas com saltos largos entre elas. Soa esparsa e marcante, como um koto.',
  'The scale behind most pop, folk and classical music. It sounds bright and happy, and every other scale is easiest to understand by comparing it to this one.':
    'A escala por trás da maior parte do pop, do folk e da música clássica. Soa brilhante e alegre, e as outras escalas ficam mais fáceis de entender comparadas a ela.',
  'The basic minor scale. Compared to major, its 3rd, 6th and 7th are one fret lower, which gives it a sad, serious sound.':
    'A escala menor básica. Comparada à maior, sua 3ª, 6ª e 7ª ficam um traste abaixo, o que lhe dá um som triste e sério.',
  'Five notes: the minor scale without its 2nd and 6th. It is the most common scale for rock and blues solos, and easy to play because it has no awkward notes.':
    'Cinco notas: a escala menor sem a 2ª e a 6ª. É a escala mais comum para solos de rock e blues, e fácil de tocar porque não tem notas complicadas.',
  'Five notes: the major scale without its 4th and 7th. It sounds sweet and open, and is common in country, pop and rock solos.':
    'Cinco notas: a escala maior sem a 4ª e a 7ª. Soa doce e aberta, e é comum em solos de country, pop e rock.',
  'The minor pentatonic scale plus one extra "blue note", the flat 5th, which adds a gritty, bluesy tension.':
    'A pentatônica menor mais uma "blue note" extra, a 5ª bemol, que acrescenta uma tensão áspera e bluesy.',
  'Degree': 'Grau',
  'Root': 'Tônica',
  'Position': 'Posição',
  'All positions': 'Todas as posições',
  'Box': 'Desenho',
  'One position selected — difficulty is focused.':
    'Uma posição escolhida — a dificuldade fica concentrada nela.',
  // Scale progress board
  'Practice': 'Prática',
  'Progress': 'Progresso',
  'Scales mastered': 'Escalas dominadas',
  'No scales shipped yet.': 'Ainda não há escalas disponíveis.',
  'Meet the scale': 'Conheça a escala',
  'What does this scale look like?': 'Como é essa escala?',
  'Play the scale': 'Tocar a escala',
  'Start practicing': 'Começar a praticar',
  'More options': 'Mais opções',
  'Fewer options': 'Menos opções',
  'New to scales? Start with:': 'Novo em escalas? Comece com:',
  'Why start here?': 'Por que começar aqui?',
  'Fewer notes (5) and no awkward fingerings — the most common first scale for guitar, and you can solo with it right away. Trade-off: it skips two notes of the full scale, so it won’t teach you scale-degree theory on its own.':
    'Menos notas (5) e sem dedilhados estranhos — a primeira escala mais comum no violão, e você já pode improvisar com ela. Contrapartida: ela pula duas notas da escala completa, então sozinha não ensina a teoria de graus da escala.',
  'The foundation scale — every other scale and key gets explained by comparing it to this one. Trade-off: seven notes means a bit more to remember, and a slightly bigger stretch for the fingers than the five-note pentatonic.':
    'A escala-base — todas as outras escalas e tonalidades são explicadas em comparação a ela. Contrapartida: sete notas significam um pouco mais para memorizar, e um alongamento um pouco maior para os dedos do que a pentatônica de cinco notas.',
  // Intervals Learning — exercises, questions and interval names
  'Identify the interval': 'Identificar o intervalo',
  'Find the note': 'Encontrar a nota',
  'Find on the neck': 'Encontrar no braço',
  'Which interval did you hear?': 'Qual intervalo você ouviu?',
  'Hear it again': 'Ouvir de novo',
  'below': 'abaixo de',
  'above the marked note': 'acima da nota marcada',
  'below the marked note': 'abaixo da nota marcada',
  'A note is marked on the neck — tap the note that completes the interval.':
    'Uma nota está marcada no braço — toque na nota que completa o intervalo.',
  'Silent mode is on — this exercise needs sound.':
    'O modo silencioso está ligado — este exercício precisa de som.',
  'Silent mode is on — “Identify the interval” needs sound.':
    'O modo silencioso está ligado — “Identificar o intervalo” precisa de som.',
  'Minor 2nd': 'Segunda menor',
  'Major 2nd': 'Segunda maior',
  'Minor 3rd': 'Terça menor',
  'Major 3rd': 'Terça maior',
  'Perfect 4th': 'Quarta justa',
  'Tritone': 'Trítono',
  'Perfect 5th': 'Quinta justa',
  'Minor 6th': 'Sexta menor',
  'Major 6th': 'Sexta maior',
  'Minor 7th': 'Sétima menor',
  'Major 7th': 'Sétima maior',
  // Intervals Learning — curriculum group names
  'Perfect 4th & 5th': 'Quarta e quinta justas',
  'Major & minor 3rds': 'Terças maior e menor',
  'Whole & half steps': 'Tons e semitons',
  'Major & minor 6ths': 'Sextas maior e menor',
  'Major & minor 7ths': 'Sétimas maior e menor',
  'The tritone': 'O trítono',
  'All intervals': 'Todos os intervalos',
  // Intervals Learning — per-quality educational copy
  'One semitone — the smallest step, two adjacent frets; a tense, grinding sound.':
    'Um semitom — o menor passo, dois trastes vizinhos; um som tenso e áspero.',
  'One semitone narrower than a major 2nd — clashing and unstable where the major 2nd sounds like a plain step.':
    'Um semitom mais estreita que a segunda maior — dissonante e instável, enquanto a segunda maior soa como um passo comum.',
  'The pull of a leading tone up to the tonic; the clash inside a tone cluster.':
    'A atração da sensível para a tônica; o choque dentro de um cluster.',
  'Two semitones — a whole step; the plain next note of a scale.':
    'Dois semitons — um tom inteiro; a próxima nota comum de uma escala.',
  'One semitone wider than a minor 2nd and one narrower than a minor 3rd — a plain step, neither harsh nor sweet.':
    'Um semitom mais larga que a segunda menor e um mais estreita que a terça menor — um passo comum, nem áspero nem doce.',
  'The step between most neighbouring scale degrees.':
    'O passo entre a maioria dos graus vizinhos de uma escala.',
  'Three semitones — the minor colour; a small, slightly sad-sounding gap.':
    'Três semitons — a cor menor; um salto pequeno que soa um pouco triste.',
  'One semitone narrower than a major 3rd — that single semitone is what makes a chord sound minor instead of major.':
    'Um semitom mais estreita que a terça maior — esse único semitom é o que faz um acorde soar menor em vez de maior.',
  'The third of a minor chord.': 'A terça de um acorde menor.',
  'Four semitones — the major colour; a bright, open, happy-sounding gap.':
    'Quatro semitons — a cor maior; um salto brilhante, aberto e alegre.',
  'One semitone wider than a minor 3rd and one narrower than a perfect 4th — bright where the minor 3rd sounds sad.':
    'Um semitom mais larga que a terça menor e um mais estreita que a quarta justa — brilhante, enquanto a terça menor soa triste.',
  'The bright third of a major chord.': 'A terça brilhante de um acorde maior.',
  'Five semitones — a strong, stable, slightly hollow consonance.':
    'Cinco semitons — uma consonância forte, estável e um pouco oca.',
  'One semitone wider than a major 3rd and one narrower than a tritone — settled and resolved where the tritone is tense.':
    'Um semitom mais larga que a terça maior e um mais estreita que o trítono — assentada e resolvida, enquanto o trítono é tenso.',
  'The sound of standard guitar tuning; root to fourth of a suspended chord.':
    'O som da afinação padrão do violão; da fundamental à quarta de um acorde suspenso.',
  'Six semitones — exactly half an octave; a tense, restless, unresolved sound.':
    'Seis semitons — exatamente meia oitava; um som tenso, inquieto e não resolvido.',
  'One semitone wider than a perfect 4th and one narrower than a perfect 5th — tense and unresolved where both perfects sound stable.':
    'Um semitom mais largo que a quarta justa e um mais estreito que a quinta justa — tenso e não resolvido, enquanto as duas justas soam estáveis.',
  'The blue note; the gap inside a dominant 7th chord that wants to resolve.':
    'A blue note; o intervalo dentro de um acorde de sétima dominante que pede resolução.',
  'Seven semitones — the most stable interval after the octave; the power-chord sound.':
    'Sete semitons — o intervalo mais estável depois da oitava; o som do power chord.',
  'One semitone wider than a tritone — solid and at rest where the tritone is tense.':
    'Um semitom mais larga que o trítono — sólida e em repouso, enquanto o trítono é tenso.',
  'Root to fifth of almost every chord; the power-chord shape.':
    'Da fundamental à quinta de quase todo acorde; o desenho do power chord.',
  'Eight semitones — a wide, wistful interval; a major 3rd turned upside down.':
    'Oito semitons — um intervalo largo e nostálgico; uma terça maior invertida.',
  'One semitone narrower than a major 6th — darker and more longing than the major 6th.':
    'Um semitom mais estreita que a sexta maior — mais escura e saudosa que a sexta maior.',
  'The top of a first-inversion major chord; root to the minor 6th degree.':
    'A nota de cima de um acorde maior na primeira inversão; da fundamental ao 6º grau menor.',
  'Nine semitones — a wide, warm, sweet interval; a minor 3rd turned upside down.':
    'Nove semitons — um intervalo largo, quente e doce; uma terça menor invertida.',
  'One semitone wider than a minor 6th and one narrower than a minor 7th — brighter and sweeter than either.':
    'Um semitom mais larga que a sexta menor e um mais estreita que a sétima menor — mais brilhante e doce que as duas.',
  'The added note of a 6th chord; root to the sixth degree of a major scale.':
    'A nota acrescentada de um acorde com sexta; da fundamental ao sexto grau da escala maior.',
  'Ten semitones — a wide, bluesy interval that leans forward and wants to resolve.':
    'Dez semitons — um intervalo largo e bluesy que puxa para a frente e pede resolução.',
  'One semitone narrower than a major 7th and one wider than a major 6th — restless where the major 7th sounds sharp and the major 6th sounds settled.':
    'Um semitom mais estreita que a sétima maior e um mais larga que a sexta maior — inquieta, enquanto a sétima maior soa aguda e a sexta maior, assentada.',
  'The interval that makes a dominant 7th chord want to resolve.':
    'O intervalo que faz um acorde de sétima dominante pedir resolução.',
  'Eleven semitones — one short of the octave; a sharp, shimmering, almost-there sound.':
    'Onze semitons — um a menos que a oitava; um som agudo, cintilante, de quase chegar.',
  'One semitone wider than a minor 7th and one narrower than the octave — it strains up toward the octave where the minor 7th sits lower and bluesier.':
    'Um semitom mais larga que a sétima menor e um mais estreita que a oitava — puxa para cima, rumo à oitava, enquanto a sétima menor fica mais baixa e mais bluesy.',
  'The bright, jazzy top of a major 7th chord.':
    'A nota de cima brilhante e jazzística de um acorde de sétima maior.',
  // Intervals Learning — progress board and Stats section
  'not started': 'não iniciado',
  'learning': 'aprendendo',
  'currently learning': 'aprendendo agora',
  'In the system': 'No sistema',
  'Started': 'Iniciados',
  'Needs work': 'Precisa de treino',
  'Accuracy': 'Precisão',
  'Avg. time': 'Tempo médio',
  // Intervals Learning — the Interval Today card
  "Today's intervals": 'Os intervalos de hoje',
  'intervals': 'intervalos',
  'new': 'para aprender',
  'to tell apart': 'para diferenciar',
  'Practise my weak intervals': 'Praticar meus intervalos fracos',
  'No weak intervals yet — keep practising and the Teacher will find them.':
    'Ainda não há intervalos fracos — continue praticando e o Professor vai encontrá-los.',
  'broadening': 'ampliação',
  // Intervals Learning — the Interval Selector controls
  'Exercise': 'Exercício',
  'Interval selection': 'Seleção de intervalos',
  'Difficulty': 'Dificuldade',
  'Direction': 'Direção',
  'One interval': 'Um intervalo',
  'A group': 'Um grupo',
  'All learned': 'Todos os aprendidos',
  'All 11': 'Os 11',
  'Fall speed': 'Velocidade de queda',
  'Slow': 'Lenta',
  'Fast': 'Rápida',
  'Focused': 'Focado',
  'Mixed': 'Misturado',
  'Ascending': 'Ascendente',
  'Descending': 'Descendente',
  'Both': 'Ambos',
  'Pick more than one interval to mix': 'Escolha mais de um intervalo para misturar',
  'Practising:': 'Praticando:',
  "You'll hear two notes. Pick the interval between them.":
    'Você vai ouvir duas notas. Escolha o intervalo entre elas.',
  "You'll see a note and an interval. Pick the note that far above it.":
    'Você vai ver uma nota e um intervalo. Escolha a nota que fica a essa distância acima dela.',
  // Intervals Learning — inline educational content
  'About this interval': 'Sobre este intervalo',
  'semitones': 'semitons',
  // Staff reading (StaffPracticeScreen)
  'A note is written on the staff. Pick its name — you will hear it after you answer.':
    'Uma nota está escrita na pauta. Escolha o nome dela — você vai ouvi-la depois de responder.',
  'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.':
    'Uma nota está escrita na pauta. Toque um lugar do braço que a toque — qualquer corda vale. Depois aparecem todos os lugares onde ela está.',
  'Range': 'Faixa',
  'Frets 0–3': 'Trastes 0–3',
  'Frets 0–5': 'Trastes 0–5',
  'Frets 0–12': 'Trastes 0–12',
  'Natural notes only': 'Só notas naturais',
  'With sharps and flats': 'Com sustenidos e bemóis',
  'Bass music is written in the bass clef, one octave above how it sounds.':
    'A música para baixo é escrita na clave de fá, uma oitava acima de como soa.',
  'Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.':
    'A música para este instrumento é escrita na clave de sol, uma oitava acima de como soa — o pequeno 8 embaixo da clave indica isso.',
  'Music for this instrument is written in the treble clef, at the pitch it sounds.':
    'A música para este instrumento é escrita na clave de sol, na altura em que soa.',
  'Practise reading notes on the staff and finding them on the neck':
    'Pratique ler notas na pauta e encontrá-las no braço',
  'A note on the staff': 'Uma nota na pauta',
  'Where is it written?': 'Onde ela está escrita?',
  'Read a phrase': 'Ler uma frase',
  'A place on the neck is marked. Tap the staff where that note is written, fine-tune with the arrows, then press Check.':
    'Um lugar do braço está marcado. Toque na pauta onde essa nota está escrita, ajuste com as setas e aperte Verificar.',
  'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.':
    'Uma frase curta está escrita na pauta. Diga o nome das notas uma após a outra — no final você vai ouvi-la.',
  'Key signature': 'Armadura de clave',
  'The signs at the start of the staff hold for every note on that letter, unless a note carries its own sign.':
    'Os sinais no início da pauta valem para todas as notas com aquele nome, a menos que uma nota tenha o próprio sinal.',
  'Notes of the key only': 'Só notas da tonalidade',
  'With accidentals': 'Com acidentes',
  'Phrase': 'Frase',
  'Tap the staff where the note is written': 'Toque na pauta onde a nota está escrita',
  'Up': 'Para cima',
  'Down': 'Para baixo',
  'Check': 'Verificar',
  'Notes mastered': 'Notas dominadas',
  'Your progress on the staff': 'Seu progresso na pauta',
  "Today's staff reading": 'A leitura de partitura de hoje',
  'Read a round of notes on the staff — the notes that are due come first.':
    'Leia uma rodada de notas na pauta — as que estão na hora de revisar vêm primeiro.',
  'Open staff reading': 'Abrir a leitura de partitura',
  'Play it on your guitar instead of naming it — the app listens through the microphone. Play the exact note you see, including its octave: that’s what this exercise is testing. Tapping still works.':
    'Toque no seu violão em vez de escolher o nome — o app ouve pelo microfone. Toque a nota exata que você vê, incluindo a oitava: é exatamente isso que este exercício testa. Tocar na tela continua funcionando.',
  '🎸 Play the phrase on your guitar': '🎸 Toque a frase no seu violão',
  // Tab reading (TabPracticeScreen)
  'Tab reading': 'Leitura de tablatura',
  'Write it in tab': 'Escrevê-la na tablatura',
  'Read a riff': 'Ler um riff',
  'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.':
    'Um número está escrito em uma linha da tablatura. Diga o nome da nota que ele toca — você vai ouvi-la depois de responder.',
  'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.':
    'Um número está escrito em uma linha da tablatura. Toque exatamente nesse lugar do braço: a linha é a corda e o número, o traste.',
  'A place on the neck is marked. Tap the tab line of its string, pick the fret number, then press Check.':
    'Um lugar do braço está marcado. Toque na linha da tablatura da corda dele, escolha o número do traste e aperte Verificar.',
  'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.':
    'Um riff curto está escrito na tablatura. Diga o nome das notas uma após a outra — no final você vai ouvi-lo.',
  'In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.':
    'Na tablatura a linha de cima é a corda mais fina e aguda, e a de baixo a mais grossa — o contrário do braço neste app, onde a corda mais grossa fica em cima.',
  'Practise reading tabs and finding every number on the neck':
    'Pratique ler tablaturas e encontrar cada número no braço',
  'Riff': 'Riff',
  'Tap the tab line of the string': 'Toque na linha da tablatura da corda',
  'A number on the tab': 'Um número na tablatura',
  'Fret': 'Traste',
  'Places mastered': 'Lugares dominados',
  'Your progress on the neck': 'Seu progresso no braço',
  "Today's tab reading": 'A leitura de tablatura de hoje',
  'Read a round of tab — the places that are due come first.':
    'Leia uma rodada de tablatura — os lugares que estão na hora de revisar vêm primeiro.',
  'Open tab reading': 'Abrir a leitura de tablatura',
  'Play it on your guitar instead of naming it — the app listens through the microphone. A pitch can’t say which string it came from, so any place that plays the right note counts — an octave either way too. Tapping still works.':
    'Toque no seu violão em vez de escolher o nome — o app ouve pelo microfone. Uma nota tocada não diz de qual corda ela veio, então qualquer lugar que toque a nota certa conta — uma oitava acima ou abaixo também. Tocar na tela continua funcionando.',
  '🎸 Play the riff on your guitar': '🎸 Toque o riff no seu violão',
  // Tab reading, Slice 2: chords and technique symbols
  'Topic': 'Tema',
  'Single notes': 'Notas soltas',
  'Techniques': 'Técnicas',
  'Name the chord': 'Nomear o acorde',
  'Play the chord': 'Tocar o acorde',
  'What does it mean?': 'O que significa?',
  'Which note do you hear at the end?': 'Qual nota se ouve no final?',
  'A chord is written in the tab: the numbers in one column are played together, and a line with no number is not played. Name the chord — you will hear it after you answer.':
    'Um acorde está escrito na tablatura: os números da mesma coluna são tocados juntos, e uma linha sem número não é tocada. Diga o nome do acorde — você vai ouvi-lo depois de responder.',
  'A chord is written in the tab. Tap every place it plays on the neck, one per string, leave the strings with no number alone, then press Check.':
    'Um acorde está escrito na tablatura. Toque cada lugar do braço onde ele soa, um por corda, deixe de lado as cordas sem número e aperte Verificar.',
  'A playing technique is written in the tab. Say what the symbol means — you will hear it after you answer.':
    'Uma técnica está escrita na tablatura. Diga o que o símbolo significa — você vai ouvi-la depois de responder.',
  'A playing technique is written in the tab. Name the note that sounds at the end of it.':
    'Uma técnica está escrita na tablatura. Diga o nome da nota que soa no final dela.',
  'The lowest note of these chords is the root, the note the chord is named after.':
    'A nota mais grave destes acordes é a fundamental, a nota que dá nome ao acorde.',
  'Chords in tab are not available for this instrument yet.':
    'Os acordes na tablatura ainda não estão disponíveis para este instrumento.',
  'Chords mastered': 'Acordes dominados',
  'Symbols mastered': 'Símbolos dominados',
  'Minor': 'Menor',
  'Hammer-on': 'Hammer-on',
  'Pull-off': 'Pull-off',
  'Slide up': 'Slide para cima',
  'Slide down': 'Slide para baixo',
  'Bend': 'Bend',
  'Vibrato': 'Vibrato',
  'Muted note': 'Nota abafada',
  'Palm mute': 'Palm mute',
  'Hammer-on: pick the first note, then press the higher fret down hard without picking again.':
    'Hammer-on: toque a primeira nota e depois pressione com força o traste mais alto sem palhetar de novo.',
  'Pull-off: pick the first note, then pull that finger off so the lower fret sounds, without picking again.':
    'Pull-off: toque a primeira nota e depois tire o dedo puxando a corda para que soe o traste mais baixo, sem palhetar de novo.',
  'Slide up: pick the first note and slide the same finger up the string to the second fret.':
    'Slide para cima: toque a primeira nota e deslize o mesmo dedo para cima na corda até o segundo traste.',
  'Slide down: pick the first note and slide the same finger down the string to the second fret.':
    'Slide para baixo: toque a primeira nota e deslize o mesmo dedo para baixo na corda até o segundo traste.',
  'Bend: pick the note and push the string sideways until it sounds as high as the fret in the second number.':
    'Bend: toque a nota e empurre a corda para o lado até ela soar tão aguda quanto o traste do segundo número.',
  'Vibrato: let the note ring and shake its pitch slightly by moving the string.':
    'Vibrato: deixe a nota soar e faça a altura oscilar levemente movendo a corda.',
  'Muted note: touch the string without pressing it down and pick — a short click with no pitch.':
    'Nota abafada: encoste na corda sem pressioná-la e palhete — um estalo curto sem altura definida.',
  'Palm mute: rest the side of the picking hand on the strings by the bridge, for a short, muffled sound.':
    'Palm mute: apoie a lateral da mão que palheta sobre as cordas perto da ponte, para um som curto e abafado.',
  // Task D — Scales fingering ("Show fingers" on the box).
  'Show fingers': 'Mostrar dedos',
  'The small number on each note is the finger that plays it: 1 index, 2 middle, 3 ring, 4 pinky, 0 an open string. One finger per fret — the hand stays in place and each finger owns its fret.':
    'O número pequeno em cada nota é o dedo que a toca: 1 indicador, 2 médio, 3 anelar, 4 mindinho, 0 corda solta. Um dedo por casa — a mão fica parada e cada dedo cuida da sua casa.',
  // Task C — Scales guided beginner path (ScalePathCard / ScaleRelativeScreen).
  'Five notes in one small box near the root — the shape most solos start from. Watch it once, then play it back.':
    'Cinco notas em um desenho pequeno perto da tônica: a forma com que a maioria dos solos começa. Assista uma vez e depois toque você.',
  'The same five notes, one box further: the root moves to the next string.':
    'As mesmas cinco notas, um desenho adiante: a tônica passa para a corda seguinte.',
  'One run that crosses from box 1 into box 2 and back, so the two boxes become one stretch of the neck.':
    'Uma única passada que cruza do desenho 1 para o desenho 2 e volta, para que os dois desenhos virem um só trecho do braço.',
  'The box you know is also a major pentatonic — only the home note changes.':
    'O desenho que você já conhece também é uma pentatônica maior: só a nota de repouso muda.',
  'Play the box you already know, but start and end on its major home note — three frets above the minor root on the thickest string.':
    'Toque o desenho que você já conhece, mas comece e termine na nota de repouso maior: três casas acima da tônica menor, na corda mais grossa.',
  'Box 1 of the minor pentatonic plus one extra note — the flat 5th, the "blue note".':
    'O desenho 1 da pentatônica menor mais uma nota extra: a quinta diminuta, a "blue note".',
  'The full seven-note minor scale: the minor pentatonic box with two more notes filled in.':
    'A escala menor completa de sete notas: o desenho da pentatônica menor com mais duas notas preenchendo os espaços.',
  'The seven-note major scale — the one every other scale is compared to.':
    'A escala maior de sete notas: aquela com a qual todas as outras são comparadas.',
  'One shape, two names':
    'Uma forma, dois nomes',
  'Same box, new home note':
    'Mesmo desenho, nova nota de repouso',
  'Your path':
    'Seu caminho',
  'Step passed! Next up:':
    'Etapa concluída! A seguir:',
  'Step passed!':
    'Etapa concluída!',
  'Not passed yet — one more clean session usually does it.':
    'Ainda não concluída: normalmente basta mais uma sessão limpa.',
  'Start this step':
    'Começar esta etapa',
  'Path complete! Practise any step again, or open More options for every scale.':
    'Caminho concluído! Pratique de novo qualquer etapa ou abra Mais opções para ver todas as escalas.',
  'Hide steps':
    'Ocultar etapas',
  'All steps':
    'Todas as etapas',
  'Finish the steps before it to unlock this one.':
    'Conclua as etapas anteriores para desbloquear esta.',
  // Scales — sequences, a ladder after Recall (wishlist 2026-10-03 item 6).
  'Sequences':
    'Sequências',
  'Groups of 3':
    'Grupos de 3',
  'Groups of 4':
    'Grupos de 4',
  'Thirds':
    'Terças',
  'Play 1-2-3, then 2-3-4, then 3-4-5… one note further each time.':
    'Toque 1-2-3, depois 2-3-4, depois 3-4-5… uma nota adiante a cada vez.',
  'Play 1-2-3-4, then 2-3-4-5… one note further each time.':
    'Toque 1-2-3-4, depois 2-3-4-5… uma nota adiante a cada vez.',
  'Skip a note, then step back: 1-3, 2-4, 3-5…':
    'Pule uma nota e volte um passo: 1-3, 2-4, 3-5…',
  'Box 1 in groups of 3, groups of 4, then thirds, up and down — so you know each note’s neighbour, not only the whole line. It opens once you can play box 1 from memory.':
    'O desenho 1 em grupos de 3, grupos de 4 e depois terças, subindo e descendo, para conhecer a vizinha de cada nota e não só a linha inteira. Abre quando você conseguir tocar o desenho 1 de memória.',
  'First, play the box from memory: only the root is lit.':
    'Primeiro, toque o desenho de memória: só a tônica está acesa.',
  'Good runs in a row:':
    'Escalas bem tocadas seguidas:',
  'Play the box from memory':
    'Tocar o desenho de memória',
  'Finish the rung before it to unlock this one.':
    'Conclua o degrau anterior para desbloquear este.',
  'Same five notes, same shape. Start and end on {minor} and they sound like a minor pentatonic — dark and bluesy. Start and end on {major} and the very same notes sound like a major pentatonic — bright and sweet.':
    'As mesmas cinco notas, a mesma forma. Comece e termine em {minor} e elas soam como uma pentatônica menor: escura e com cara de blues. Comece e termine em {major} e exatamente as mesmas notas soam como uma pentatônica maior: brilhante e doce.',
  'On the thickest string, the major home note sits three frets above the minor one.':
    'Na corda mais grossa, a nota de repouso maior fica três casas acima da menor.',
  'Count the degrees from':
    'Contar os graus a partir de',
  'Back to the path':
    'Voltar ao caminho',
  // Scales path step 0 — "One string, four fingers" + "Make it ring" (ScaleRingTips).
  'Before any scale: one finger per fret on one string, up and back. Press just behind the fret and let every note ring.':
    'Antes de qualquer escala: um dedo por casa em uma só corda, subindo e voltando. Aperte logo atrás do traste e deixe cada nota soar.',
  'One string, four fingers':
    'Uma corda, quatro dedos',
  'Make it ring':
    'Deixe soar',
  'Where the fingertip goes':
    'Onde vai a ponta do dedo',
  'Arch the finger, thumb behind the neck':
    'Dedo arqueado, polegar atrás do braço',
  'Thumb behind the neck, about behind your middle finger — not wrapped over the top.':
    'O polegar atrás do braço, mais ou menos atrás do dedo médio, sem abraçar o braço por cima.',
  'Fingertip just behind the fret wire, not on top of it.':
    'A ponta do dedo logo atrás do traste de metal, não em cima dele.',
  'Arch the finger so only the tip touches: the string next to it must still ring.':
    'Arqueie o dedo para que só a ponta encoste: a corda ao lado precisa continuar soando.',
  'One finger per fret: finger 1 on fret 5, 2 on 6, 3 on 7, 4 on 8. Let each note ring before the next.':
    'Um dedo por casa: dedo 1 na casa 5, 2 na 6, 3 na 7, 4 na 8. Deixe cada nota soar antes da próxima.',
  'Fingertip just behind the fret. Let each note ring before the next.':
    'A ponta do dedo logo atrás do traste. Deixe cada nota soar antes da próxima.',

  // Task B — Scales metronome + gradual tempo ("Tap the scale in order").
  'Metronome': 'Metrônomo',
  'Slower': 'Mais devagar',
  'Faster': 'Mais rápido',
  'Tempo': 'Andamento',
  'Play one note on each click. After a clean run — no wrong notes and nearly every note on the click — the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'Toque uma nota a cada clique. Depois de uma passada limpa — sem notas erradas e quase todas no clique — o andamento sobe 4 BPM. Cada escala e desenho guarda seu próprio andamento.',
  'The scales and boxes you picked have different tempos — this sets them all.':
    'As escalas e desenhos escolhidos têm andamentos diferentes — isto ajusta todos.',
  'On time': 'No tempo',
  'Early': 'Adiantada',
  'Late': 'Atrasada',
  'Last run': 'Última passada',
  'on the click': 'no clique',
  'early': 'adiantadas',
  'late': 'atrasadas',
  'You are rushing — wait for the click.': 'Você está correndo — espere o clique.',
  'You are dragging — play right on the click.': 'Você está arrastando — toque bem no clique.',
  'Clean run! Tempo up to': 'Passada limpa! O andamento sobe para',
  'Clean run at the top tempo!': 'Passada limpa no andamento máximo!',
  'Not clean yet — the tempo stays at': 'Ainda não ficou limpa — o andamento continua em',

  // Wishlist 2026-10-03 item 1 — Scales: plain words, in place (ScaleTermHint).
  'What does this word mean?':
    'O que essa palavra quer dizer?',
  'What the words mean':
    'O que as palavras querem dizer',
  'A box is one hand-sized patch of the neck where the whole scale fits under your four fingers without moving your hand — its number says which patch, not a finger or a fret.':
    'Um desenho é uma região do braço do tamanho da mão onde a escala inteira cabe sob os seus quatro dedos sem mover a mão — o número diz qual região, não um dedo nem um traste.',
  'The root is the scale’s home note, the one it is named after — it has the gold ring.':
    'A tônica é a nota de casa da escala, a que dá nome a ela — ela tem o anel dourado.',
  'A degree is a note’s place in the scale, counted up from the root, which is 1 — a “b” before the number means one fret lower.':
    'Um grau é o lugar de uma nota na escala, contando a partir da tônica, que é o 1 — um “b” antes do número quer dizer um traste abaixo.',
  'Strings are numbered from the thinnest (1) to the thickest, so the thickest string — the lit row on top — has the highest number.':
    'As cordas são numeradas da mais fina (1) à mais grossa, então a mais grossa — a fileira acesa no topo — tem o número mais alto.',
  'A fret is one numbered slot along the neck — press just behind its metal wire; the numbers under the board are the frets.':
    'Um traste é uma casa numerada ao longo do braço — aperte logo atrás do fio de metal; os números embaixo do tabuleiro são os trastes.',
  // Scales — "I play, you play it back" (call and response by ear).
  'Play it back by ear': 'Toque de ouvido',
  'The app plays a few notes from the box — nothing lights up, so listen. Then play them back on your guitar or tap them. Every phrase starts on the root (gold ring). Two clean phrases in a row and the next one is a note longer.': 'O app toca algumas notas do desenho — nada acende, então escute. Depois toque-as de volta no violão ou toque na tela. Toda frase começa na tônica (anel dourado). Duas frases limpas seguidas e a próxima ganha mais uma nota.',
  'The box on the board': 'O desenho no tabuleiro',
  'With only the root lit, your ear finds the notes, not your eye.': 'Só com a tônica acesa, quem acha as notas é o seu ouvido, não o olho.',
  'Notes in the phrase': 'Notas na frase',
  'Listen…': 'Escute…',
  '✓ Clean — the next phrase is one note longer.': '✓ Limpa — a próxima frase tem uma nota a mais.',
  '✓ Clean!': '✓ Limpa!',
  'Found it, with a slip.': 'Achou, com um deslize.',
  'Missed — the next phrase is one note shorter.': 'Errou — a próxima frase tem uma nota a menos.',
  'Longest phrase played back': 'Frase mais longa que você repetiu',
  '🎸 Play the notes back on your guitar': '🎸 Toque as notas de volta no violão',
};
