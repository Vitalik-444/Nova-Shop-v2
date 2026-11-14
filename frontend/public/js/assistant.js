(function () {
    if (document.getElementById('nova-assistant-btn')) return;

    var history = [];
    var isOpen = false;
    var isLoading = false;

    function getLang() {
        try {
            var stored = localStorage.getItem('language');
            if (stored && typeof stored === 'string') {
                return stored.toLowerCase().startsWith('en') ? 'en' : 'uk';
            }
        } catch {}
        var htmlLang = document.documentElement.lang || '';
        return htmlLang.toLowerCase().startsWith('en') ? 'en' : 'uk';
    }

    var i18n = {
        uk: {
            title: 'Нова',
            triggerLabel: 'Чат з асистентом Нова',
            closeLabel: 'Закрити',
            status: 'В мережі',
            placeholder: 'Запитайте про товари NovaShop...',
            sendLabel: 'Надіслати',
            typing: 'Нова пише...',
            greeting: 'Вітаю! Я Нова — ваш віртуальний ІІ-асистент магазину NovaShop. Підкажу інформацію про товари, ціни та наявність. Чим можу допомогти?',
            errorReply: 'Вибачте, виникла помилка відповіді.',
            networkError: 'Не вдалося зв\'язатися з сервером. Перевірте підключення до мережі.'
        },
        en: {
            title: 'Nova',
            triggerLabel: 'Chat with Nova Assistant',
            closeLabel: 'Close',
            status: 'Online',
            placeholder: 'Ask about NovaShop products...',
            sendLabel: 'Send',
            typing: 'Nova is typing...',
            greeting: 'Hello! I am Nova — your virtual AI assistant for NovaShop. I can help with products, prices, and availability. How can I help you?',
            errorReply: 'Sorry, an error occurred while processing the response.',
            networkError: 'Unable to connect to the server. Please check your network connection.'
        }
    };

    var triggerBtn = document.createElement('button');
    triggerBtn.id = 'nova-assistant-btn';
    triggerBtn.className = 'nova-assistant-trigger';
    triggerBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

    var chatWindow = document.createElement('div');
    chatWindow.id = 'nova-assistant-window';
    chatWindow.className = 'nova-assistant-window';

    var header = document.createElement('div');
    header.className = 'nova-assistant-header';

    var brand = document.createElement('div');
    brand.className = 'nova-assistant-brand';

    var avatar = document.createElement('div');
    avatar.className = 'nova-assistant-avatar';
    avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';

    var titlesWrap = document.createElement('div');
    var title = document.createElement('div');
    title.className = 'nova-assistant-title';

    var status = document.createElement('div');
    status.className = 'nova-assistant-status';
    var statusDot = document.createElement('span');
    statusDot.className = 'nova-status-dot';
    var statusText = document.createElement('span');
    statusText.textContent = 'В мережі';
    status.appendChild(statusDot);
    status.appendChild(statusText);

    titlesWrap.appendChild(title);
    titlesWrap.appendChild(status);

    brand.appendChild(avatar);
    brand.appendChild(titlesWrap);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'nova-assistant-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    header.appendChild(brand);
    header.appendChild(closeBtn);

    var messagesList = document.createElement('div');
    messagesList.className = 'nova-assistant-messages';

    var form = document.createElement('form');
    form.className = 'nova-assistant-form';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'nova-assistant-input';
    input.maxLength = 500;
    input.autocomplete = 'off';

    var sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'nova-assistant-send';
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

    form.appendChild(input);
    form.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesList);
    chatWindow.appendChild(form);

    document.body.appendChild(triggerBtn);
    document.body.appendChild(chatWindow);

    function updateTexts() {
        var lang = getLang();
        var texts = i18n[lang] || i18n.uk;
        title.textContent = texts.title;
        statusText.textContent = texts.status;
        input.placeholder = texts.placeholder;
        triggerBtn.setAttribute('aria-label', texts.triggerLabel);
        closeBtn.setAttribute('aria-label', texts.closeLabel);
        sendBtn.setAttribute('aria-label', texts.sendLabel);
        if (typingLabel) typingLabel.textContent = texts.typing;
    }

    function addMessage(role, text) {
        var msg = document.createElement('div');
        msg.className = role === 'user' ? 'nova-msg nova-msg-user' : 'nova-msg nova-msg-bot';
        msg.textContent = text;
        messagesList.appendChild(msg);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    var typingIndicator = document.createElement('div');
    typingIndicator.className = 'nova-typing';
    var dots = document.createElement('div');
    dots.className = 'nova-typing-dots';
    dots.appendChild(document.createElement('span'));
    dots.appendChild(document.createElement('span'));
    dots.appendChild(document.createElement('span'));
    var typingLabel = document.createElement('span');
    typingIndicator.appendChild(dots);
    typingIndicator.appendChild(typingLabel);

    function showTyping() {
        if (!messagesList.contains(typingIndicator)) {
            messagesList.appendChild(typingIndicator);
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    }

    function hideTyping() {
        if (messagesList.contains(typingIndicator)) {
            messagesList.removeChild(typingIndicator);
        }
    }

    updateTexts();

    var initialLang = getLang();
    addMessage('model', (i18n[initialLang] || i18n.uk).greeting);

    try {
        new MutationObserver(function () {
            updateTexts();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch {}

    function toggleChat(open) {
        isOpen = typeof open === 'boolean' ? open : !isOpen;
        if (isOpen) {
            updateTexts();
            chatWindow.classList.add('open');
            triggerBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
            setTimeout(function () {
                input.focus();
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 50);
        } else {
            chatWindow.classList.remove('open');
            triggerBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        }
    }

    triggerBtn.addEventListener('click', function () {
        toggleChat();
    });

    closeBtn.addEventListener('click', function () {
        toggleChat(false);
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text || isLoading) return;

        var activeLang = getLang();
        var activeTexts = i18n[activeLang] || i18n.uk;

        input.value = '';
        addMessage('user', text);
        showTyping();

        isLoading = true;
        input.disabled = true;
        sendBtn.disabled = true;

        try {
            var res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: history,
                    language: activeLang
                })
            });

            var data = await res.json();
            hideTyping();

            var replyText = (data && data.reply) ? data.reply : activeTexts.errorReply;
            addMessage('model', replyText);

            history.push({ role: 'user', content: text });
            history.push({ role: 'model', content: replyText });
            if (history.length > 20) {
                history = history.slice(-20);
            }
        } catch {
            hideTyping();
            addMessage('model', activeTexts.networkError);
        } finally {
            isLoading = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    });
})();