document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pageSelectionForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get all selected page numbers
        const selectedPages = Array.from(document.querySelectorAll('.input-container input[type="checkbox"]:checked')).map(cb => cb.value);

        // Ensure first and last pages are included
        if (!selectedPages.includes('Page1')) selectedPages.unshift('Page1');
        if (!selectedPages.includes('Page13')) selectedPages.push('Page13');

        // Fetch and compile selected pages
        const compiledHTML = await compilePages(selectedPages);

        // Send compiled HTML to the server-side endpoint, which forwards it to Zapier
        sendToWebhook(compiledHTML);
    });

    async function compilePages(pageIds) {
        const pagesContent = await Promise.all(pageIds.map(pageId => fetchPageContent(pageId)));
        return pagesContent.join('\n');
    }

    async function fetchPageContent(pageId) {
        // Fetch the content of each selected HTML page
        const response = await fetch(`${pageId}.html`);
        if (!response.ok) throw new Error(`Failed to fetch ${pageId}`);
        return response.text();
    }

    function sendToWebhook(compiledHTML) {
        // Send the compiled HTML as JSON to your server-side proxy
        fetch('/send-to-zapier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Specify that we're sending JSON
            },
            body: JSON.stringify({ html: compiledHTML }), // Send the compiled HTML as part of a JSON object
        })
        .then(response => {
            if (response.ok) {
                // Assuming the server responds with JSON
                return response.json();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => console.log('Success:', data))
        .catch((error) => console.error('Error:', error));
    }
});
app.post('/send-to-zapier', async (req, res) => {
    console.log('Received payload:', req.body);
    const { html } = req.body;
    try {
        const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/13990135/3epjy1z/', {
            method: 'POST',
            headers: { 'Content-Type': 'text/html' },
            body: html,
        });
        if (!zapierResponse.ok) {
            throw new Error(`Zapier responded with status: ${zapierResponse.status}`);
        }
        const data = await zapierResponse.text();
        res.send(data);
    } catch (error) {
        console.error('Error forwarding request:', error);
        res.status(500).send('Error forwarding request to Zapier');
    }
});