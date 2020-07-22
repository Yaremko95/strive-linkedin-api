const { join } = require("path");
const Q = require("q");
const pdf = require("html-pdf");
const twig = require("twig");

const generatePdf = (user, callback) => {
  const PdfOptions = {
    format: "Letter",
    base: join(__dirname, "./view"),
    header: {
      height: "0mm",
      margin: "0mm",
      padding: "",
      contents: "",
    },
    footer: {
      height: "15mm",
      contents: "",
    },
  };

  const createTemplate = Q.denodeify(twig.renderFile);
  const path = join(__dirname, "./view/pdfView.twig");
  const renderedTemplate = createTemplate(path, user);
  renderedTemplate.then(function (html) {
    pdf.create(html, PdfOptions).toStream(function (err, stream) {
      callback(stream);
    });
  });
};

module.exports = generatePdf;
