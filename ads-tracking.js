/* Loaded only after the regional privacy gate allows basic measurement. */
(() => {
  if (window.deltaAds) return;

  const realNumber = "9015684128";
  const realDisplay = "901-568-4128";
  const originalNumber = /(?:\+?1[\s.-]?)?901[\s.-]?568[\s.-]?4128/g;
  const convertedForms = new Set();
  let phoneDisplay = realDisplay;

  let replacePhone = () => {};

  window.deltaAds = Object.freeze({
    phoneNumber: () => phoneDisplay,
    replacePhone: (formatted, mobile) => replacePhone(formatted, mobile),
    trackFormConversion: (formId) => {
      // Each form permits one accepted submission per page. The submit handler
      // calls this only after Netlify returns an accepted response, never on click.
      if (!window.deltaMeasurement?.enabled() || !["quote", "contact"].includes(formId) || convertedForms.has(formId)) return;
      convertedForms.add(formId);
      window.deltaMeasurement.conversion(formId);
    },
  });

  const configure = () => {
    const phoneLinks = [...document.querySelectorAll('a[href^="tel:"]')]
      .filter((link) => link.getAttribute("href").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") === realNumber)
      .map((link) => {
        const text = [];
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.nodeValue.includes(realDisplay) || node.nodeValue.includes(realNumber)) {
            text.push({ node, original: node.nodeValue });
          }
        }
        return { link, text, label: link.getAttribute("aria-label") };
      });

    replacePhone = (formattedNumber, mobileNumber) => {
      // Only accept a usable phone result. Text nodes preserve the call icon and
      // surrounding copy, and the original HTML remains a no-JS/network fallback.
      if (!window.deltaMeasurement?.enabled() || typeof formattedNumber !== "string" || typeof mobileNumber !== "string" ||
          !/^[+\d() .-]+$/.test(formattedNumber) || !/^\+?\d{7,15}$/.test(mobileNumber)) return;
      const displayDigits = formattedNumber.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
      const mobileDigits = mobileNumber.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
      if (displayDigits !== mobileDigits) return;
      phoneDisplay = formattedNumber;
      phoneLinks.forEach(({ link, text, label }) => {
        link.setAttribute("href", `tel:${mobileNumber}`);
        text.forEach(({ node, original }) => { node.nodeValue = original.replace(originalNumber, formattedNumber); });
        if (label) link.setAttribute("aria-label", label.replace(originalNumber, formattedNumber));
      });
    };

    // Restore every original phone representation when measurement is withdrawn.
    window.addEventListener("delta:measurement-off", () => {
      phoneDisplay = realDisplay;
      phoneLinks.forEach(({ link, text, label }) => {
        link.setAttribute("href", `tel:${realNumber}`);
        text.forEach(({ node, original }) => { node.nodeValue = original; });
        if (label) link.setAttribute("aria-label", label);
      });
    });

  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", configure, { once: true });
  else configure();
})();
