## HTML Email Template Generation

This module is a wrapper on top of [Handlebars.js](https://handlebarsjs.com/guide/) library.
It takes in a templated HTML file & input variables and generates a expanded template.

For example:
1. The following templated HTML file where variables `firstname` & `lastname` can take dynamic values.
```
<html>
    <body>
        <p>{{firstname}} {{lastname}}</p>
    </body>
</html>
```

2. `EmailTemplateGenerator` class takes a HTML template as above and values for the variables and produces the following.

```
const event = { firstname: 'Andrew', lastname: 'Milich' };
const emailTemplate = new EmailTemplateGenerator(EmailTypes.Invite, event);
const generatedTemplateContent = await emailTemplate.generate();
```

```
<html>
    <body>
        <p>Andrew Milich</p>
    </body>
</html>
```
