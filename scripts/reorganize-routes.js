const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'app');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function removeRecursiveSync(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// 1. Move (admin) -> admin
const adminSrc = path.join(appDir, '(admin)');
const adminDest = path.join(appDir, 'admin');
if (fs.existsSync(adminSrc)) {
  copyRecursiveSync(adminSrc, adminDest);
  removeRecursiveSync(adminSrc);
  console.log('Moved (admin) -> admin');
}

// 2. Move (creator) -> creator
const creatorSrc = path.join(appDir, '(creator)');
const creatorDest = path.join(appDir, 'creator');
if (fs.existsSync(creatorSrc)) {
  copyRecursiveSync(creatorSrc, creatorDest);
  removeRecursiveSync(creatorSrc);
  console.log('Moved (creator) -> creator');
}

// 3. Move (absorber) -> absorber
const absorberSrc = path.join(appDir, '(absorber)');
const absorberDest = path.join(appDir, 'absorber');
if (fs.existsSync(absorberSrc)) {
  copyRecursiveSync(absorberSrc, absorberDest);
  removeRecursiveSync(absorberSrc);
  console.log('Moved (absorber) -> absorber');
}

// 4. Move (auth)/login and (auth)/register -> login and register
const authSrc = path.join(appDir, '(auth)');
if (fs.existsSync(authSrc)) {
  if (fs.existsSync(path.join(authSrc, 'login'))) {
    copyRecursiveSync(path.join(authSrc, 'login'), path.join(appDir, 'login'));
  }
  if (fs.existsSync(path.join(authSrc, 'register'))) {
    copyRecursiveSync(path.join(authSrc, 'register'), path.join(appDir, 'register'));
  }
  removeRecursiveSync(authSrc);
  console.log('Moved (auth) -> login, register');
}

// 5. Move (public)/... -> pricing, how-it-works, categories
const publicSrc = path.join(appDir, '(public)');
if (fs.existsSync(publicSrc)) {
  if (fs.existsSync(path.join(publicSrc, 'pricing'))) {
    copyRecursiveSync(path.join(publicSrc, 'pricing'), path.join(appDir, 'pricing'));
  }
  if (fs.existsSync(path.join(publicSrc, 'how-it-works'))) {
    copyRecursiveSync(path.join(publicSrc, 'how-it-works'), path.join(appDir, 'how-it-works'));
  }
  if (fs.existsSync(path.join(publicSrc, 'categories'))) {
    copyRecursiveSync(path.join(publicSrc, 'categories'), path.join(appDir, 'categories'));
  }
  removeRecursiveSync(publicSrc);
  console.log('Moved (public) -> pricing, how-it-works, categories');
}

// 6. Fix MessageSquareCheck in how-it-works/page.tsx
const howItWorksPath = path.join(appDir, 'how-it-works', 'page.tsx');
if (fs.existsSync(howItWorksPath)) {
  let content = fs.readFileSync(howItWorksPath, 'utf8');
  content = content.replace(/MessageSquareCheck/g, 'MessageSquare');
  fs.writeFileSync(howItWorksPath, content, 'utf8');
  console.log('Fixed MessageSquareCheck in how-it-works/page.tsx');
}

// 7. Fix MessageSquareCheck in creator/responses/page.tsx if present
const creatorRespPath = path.join(appDir, 'creator', 'responses', 'page.tsx');
if (fs.existsSync(creatorRespPath)) {
  let content = fs.readFileSync(creatorRespPath, 'utf8');
  content = content.replace(/MessageSquareCheck/g, 'MessageSquare');
  fs.writeFileSync(creatorRespPath, content, 'utf8');
  console.log('Fixed MessageSquareCheck in creator/responses/page.tsx');
}

console.log('Migration completed successfully!');
