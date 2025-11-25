const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

class TemplateManager {
    renderTemplate(template_name, data = {}) {
        let filePath = path.resolve(template_name + '.ejs');
        const file = fs.readFileSync(filePath, 'utf8');
        return ejs.render(file, data);
    }
    renderTemplateBrute(template_name, data = {}) {
        let filePath = path.resolve(template_name + '.ejs');
        return fs.readFileSync(filePath, 'utf8')
    }
}

module.exports = TemplateManager;
