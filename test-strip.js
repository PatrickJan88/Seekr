const stripHtml = (html) => {
    if (!html) return 'No description available.';
    
    // First, unescape HTML entities if they exist.
    // In node we can't use DOMParser, but we can simulate it with regex.
    let text = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    // Then strip tags.
    text = text.replace(/<[^>]*>?/gm, '');
    return text.trim();
};
const encoded = '&lt;div class=&quot;content-intro&quot;&gt;&lt;h2 style=&quot;font-family: GothamBold,Helvetica,Arial,sans-serif; color: #662d91;&quot;&gt;Teamwork makes the stream work.&lt;/h2&gt;\n&lt;p&gt;&amp;nbsp;&lt;/p&gt;';
console.log(stripHtml(encoded));
