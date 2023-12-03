const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const baseUrl = 'https://skiff.com/blog';


    const { data: response } = await got(String(baseUrl));
    const $ = cheerio.load(response);

    const items = $('.flex.w-full.flex-col div')
        .toArray()
        .filter((item) => $(item).find('a').length > 0)
        .map((item) => {
            const $item = $(item);
            const spans = $item.find('span');

            // Adjust the title selection logic
            let title = '';
            if ($item.find('h3').length > 0) {
                title = $item.find('h3').text();
            } else if (spans.length > 1) {
                title = $(spans[1]).text(); // Wrap the DOM element in jQuery to use .text()
            }

            // Ensure there is at least one span for author and description
            const author = spans.length > 0 ? spans.first().text() : '';
            const description = spans.length > 0 ? spans.last().text() : '';

            return {
                title,
                author,
                link: $item.find('a').attr('href'),
                description,
            };
        });

    ctx.state.data = {
        // channel title
        title: 'Skiff Blog',
        // channel link
        link: String(baseUrl),
        // each feed item
        item: items,
        language: 'en-us'
    };
};
