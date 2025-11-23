#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Rutas de los archivos
const envDir = path.join(__dirname, 'src', 'environments');
const prodTemplatePath = path.join(envDir, 'environment.prod.template.ts');
const devTemplatePath = path.join(envDir, 'environment.dev.template.ts');
const prodEnvPath = path.join(envDir, 'environment.ts');
const devEnvPath = path.join(envDir, 'environment.development.ts');

console.log('🔧 Configurando archivos de entorno...');

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Error: Las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son requeridas'
  );
  console.log('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗ (no definida)');
  console.log('   SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗ (no definida)');
  process.exit(1);
}

try {
  // Leer el template de producción
  let prodContent = fs.readFileSync(prodTemplatePath, 'utf8');

  // Reemplazar los placeholders
  prodContent = prodContent
    .replace('SUPABASE_URL_PLACEHOLDER', supabaseUrl)
    .replace('SUPABASE_ANON_KEY_PLACEHOLDER', supabaseKey);

  // Escribir el archivo de producción
  fs.writeFileSync(prodEnvPath, prodContent);
  console.log('✓ Creado:', prodEnvPath);

  // Leer el template de desarrollo
  let devContent = fs.readFileSync(devTemplatePath, 'utf8');

  // Reemplazar los placeholders
  devContent = devContent
    .replace('SUPABASE_URL_PLACEHOLDER', supabaseUrl)
    .replace('SUPABASE_ANON_KEY_PLACEHOLDER', supabaseKey);

  // Escribir el archivo de desarrollo
  fs.writeFileSync(devEnvPath, devContent);
  console.log('✓ Creado:', devEnvPath);

  console.log('✅ Archivos de entorno configurados exitosamente');
} catch (error) {
  console.error('❌ Error al configurar archivos de entorno:', error.message);
  process.exit(1);
}
