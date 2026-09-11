# SIGAgro

**Sistema de Información Geográfica Agropecuaria**

Proyecto de la materia Paradigmas y Lenguajes de Programación III.
Ingeniería en Sistemas de Información — 3.er año.
Desarrollado por el grupo **Nipintucu**.

## Integrantes

- Juan Carlos Abente ([@juankiabente](https://github.com/juankiabente))
- Emilia Auras  ([@emiauras](https://github.com/Emiauras))

## Descripción

SIGAgro permite a productores e ingenieros agrónomos registrar sus
establecimientos, delimitar parcelas sobre un mapa, definir puntos de
muestreo y llevar el historial de observaciones tomadas a campo.

El caso de estudio es la producción de yerba mate en Misiones.

## Estado actual: AE1 — Frontend estático

Maquetado en HTML5 y CSS3, sin frameworks ni librerías externas.

| Archivo | Sección |
|---|---|
| `index.html` | Portada |
| `listado_tabla.html` | Listado de parcelas en tabla |
| `listado_box.html` | Listado de parcelas en tarjetas |
| `producto.html` | Ficha de una parcela |
| `comprar.html` | Solicitud de servicio de muestreo |

**Demo:** https://juankiabente.github.io/sigagro/
**Documentación:** [docs/AE1-analisis-y-diseno.pdf](docs/AE1-analisis-y-diseno.pdf)

## Estructura

```
sigagro/
├── index.html          Páginas en la raíz
├── css/
│   ├── base.css        Tokens, tipografía y componentes compartidos
│   └── paginas.css     Estilos propios de cada sección
├── img/                Imágenes del sitio
└── docs/               Documentación de la cátedra
```

## Cómo verlo en local

1. Clonar el repositorio.
2. Abrir la carpeta en Visual Studio Code.
3. Clic derecho sobre `index.html` → *Open with Live Server*.

## Stack previsto

PHP 8.2 · Yii2 · MySQL 8 · Leaflet

## Convenciones

- Nombres de archivo en minúsculas, sin espacios, tildes ni ñ.
- Rutas relativas, nunca absolutas.
- Una rama por funcionalidad (`feat/nombre`), merge a `main` por Pull Request.
- `css/base.css` es compartido: cualquier cambio se acuerda entre los tres.
