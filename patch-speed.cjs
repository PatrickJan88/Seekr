const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remotive
code = code.replace(
  /for \(const category of categories\) \{([\s\S]*?)\}\s*\} catch \(e\) \{/g,
  function(match, inner) {
    if (inner.includes('remotive')) {
      return `await Promise.allSettled(categories.map(async (category) => {${inner}}));\n        } catch (e) {`;
    }
    return match;
  }
);

// Jooble
code = code.replace(
  /for \(const query of queries\) \{([\s\S]*?)\}\s*\} catch \(e\) \{/g,
  function(match, inner) {
    if (inner.includes('jooble')) {
      return `await Promise.allSettled(queries.map(async (query) => {${inner}}));\n        } catch (e) {`;
    }
    return match;
  }
);

// Adzuna
code = code.replace(
  /for \(const country of countries\) \{([\s\S]*?)\}\s*\} catch \(e\) \{/g,
  function(match, inner) {
    if (inner.includes('adzuna')) {
      return `await Promise.allSettled(countries.map(async (country) => {${inner}}));\n        } catch (e) {`;
    }
    return match;
  }
);

fs.writeFileSync('server.ts', code);
console.log('patched loops to parallel');
