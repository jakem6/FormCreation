document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pageSelectionForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get all selected page numbers
        const selectedPages = Array.from(document.querySelectorAll('.input-container input[type="checkbox"]:checked')).map(cb => cb.value);

        // Always include first and last pages
        if (!selectedPages.includes('Page1')) selectedPages.unshift('Page1');
        if (!selectedPages.includes('Page13')) selectedPages.push('Page13');

        // Fetch and compile selected pages
        const compiledHTML = await compilePages(selectedPages);

        // Send compiled HTML to the webhook
        sendToWebhook(compiledHTML);
    });

    async function compilePages(pageIds) {
        const pagesContent = await Promise.all(pageIds.map(pageId => fetchPageContent(pageId)));
        return pagesContent.join('');
    }

    async function fetchPageContent(pageId) {
        const response = await fetch(`${pageId}.html`);
        if (!response.ok) throw new Error(`Failed to fetch ${pageId}`);
        return response.text();
    }

    function sendToWebhook(compiledHTML) {
        fetch('https://hooks.zapier.com/hooks/catch/13990135/3epjy1z/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html: compiledHTML }),
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch((error) => console.error('Error:', error));
    }
});
