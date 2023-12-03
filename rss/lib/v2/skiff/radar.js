module.exports = {
    'skiff.com/blog': {
        _name: 'Skiff Blog',
        '.': [
            {
                title: 'Blog',
                docs: '',
                source: ['/'],
                target: (params, url) => `${params} a${url}`,
            },
        ],
    },
};
