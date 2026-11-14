(function () {
    if (document.getElementById('nova-assistant-btn')) return;

    var history = [];
    var isOpen = false;
    var isLoading = false;

    var triggerBtn = document.createElement('button');
    triggerBtn.id = 'nova-assistant-btn';
    triggerBtn.className = 'nova-assistant-trigger';
    triggerBtn.setAttribute('aria-label', 'Чат з асистентом Нова');
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
    title.textContent = 'Нова';

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
    closeBtn.setAttribute('aria-label', 'Закрити');
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
    input.placeholder = 'Запитайте про товари NovaShop...';
    input.maxLength = 500;
    input.autocomplete = 'off';

    var sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'nova-assistant-send';
    sendBtn.setAttribute('aria-label', 'Надіслати');
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

    form.appendChild(input);
    form.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesList);
    chatWindow.appendChild(form);

    document.body.appendChild(triggerBtn);
    document.body.appendChild(chatWindow);

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
    typingLabel.textContent = 'Нова пише...';
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

    addMessage('model', 'Вітаю! Я Нова — ваш віртуальний ІІ-асистент магазину NovaShop. Підкажу інформацію про товари, ціни та наявність. Чим можу допомогти?');

    function toggleChat(open) {
        isOpen = typeof open === 'boolean' ? open : !isOpen;
        if (isOpen) {
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
                    history: history
                })
            });

            var data = await res.json();
            hideTyping();

            var replyText = (data && data.reply) ? data.reply : 'Вибачте, виникла помилка відповіді.';
            addMessage('model', replyText);

            history.push({ role: 'user', content: text });
            history.push({ role: 'model', content: replyText });
            if (history.length > 20) {
                history = history.slice(-20);
            }
        } catch {
            hideTyping();
            addMessage('model', 'Не вдалося зв\'язатися з сервером. Перевірте підключення до мережі.');
        } finally {
            isLoading = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    });
})();
