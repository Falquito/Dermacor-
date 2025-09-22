# Contributing to CareLink

¡Gracias por tu interés en contribuir a CareLink! Este documento proporciona pautas para contribuir al proyecto.

## 🚀 Cómo contribuir

### Reportar bugs
- Usa la plantilla de bug report en GitHub Issues
- Proporciona información detallada sobre el problema
- Incluye pasos para reproducir el bug

### Solicitar features
- Usa la plantilla de feature request en GitHub Issues
- Describe claramente la funcionalidad solicitada
- Explica por qué sería útil para el proyecto

### Pull Requests
1. Fork el repositorio
2. Crea una nueva rama desde `develop`
3. Realiza tus cambios
4. Asegúrate de que pasen todos los tests y linting
5. Crea un Pull Request con una descripción clara

## 📋 Estándares de código

- Usa TypeScript para todo el código nuevo
- Sigue las reglas de ESLint configuradas
- Usa Prettier para el formateo automático
- Escribe nombres descriptivos para variables y funciones
- Agrega comentarios para lógica compleja

## 🧪 Testing

- Ejecuta `npm run lint` antes de hacer commit
- Asegúrate de que `npm run build` funcione correctamente
- Prueba tu funcionalidad manualmente

## 📝 Convenciones de commit

Usa conventional commits:
- `feat:` para nuevas funcionalidades
- `fix:` para correcciones de bugs
- `docs:` para cambios en documentación
- `style:` para cambios de formato
- `refactor:` para refactoring de código
- `test:` para agregar o modificar tests
- `chore:` para tareas de mantenimiento

Ejemplo: `feat: agregar autenticación de usuarios`