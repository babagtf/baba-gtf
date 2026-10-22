#!/usr/bin/env python3
"""
Visualizador da estrutura do projeto.

Exibe apenas os diretórios e arquivos relevantes, ocultando
pastas e arquivos gerados automaticamente pelo ecossistema
Python, React, Vite, Git e IDEs.
"""

from pathlib import Path

ROOT = Path.cwd()

IGNORED_NAMES = {
    # Python
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    ".coverage",
    "htmlcov",
    "build",
    "dist",

    # React / Vite
    "node_modules",
    ".vite",
    ".cache",

    # Git / IDE
    ".git",
    ".idea",
    ".vscode",

    # Sistema
    ".DS_Store",
    "Thumbs.db",
}


def should_ignore(entry: Path) -> bool:
    """Retorna True caso o arquivo/pasta deva ser ocultado."""

    if entry.name in IGNORED_NAMES:
        return True

    if entry.name.endswith(".egg-info"):
        return True

    return False


def tree(directory: Path, prefix: str = "", max_depth: int = 6):
    """
    Exibe a árvore de diretórios.

    Args:
        directory: Diretório raiz.
        prefix: Prefixo utilizado na recursão.
        max_depth: Profundidade máxima.
    """

    if max_depth <= 0:
        return

    try:
        entries = sorted(
            (
                entry
                for entry in directory.iterdir()
                if not should_ignore(entry)
            ),
            key=lambda e: (not e.is_dir(), e.name.lower()),
        )
    except PermissionError:
        return

    for index, entry in enumerate(entries):
        connector = "└── " if index == len(entries) - 1 else "├── "

        print(f"{prefix}{connector}{entry.name}")

        if entry.is_dir():
            extension = "    " if index == len(entries) - 1 else "│   "
            tree(
                entry,
                prefix + extension,
                max_depth - 1,
            )


if __name__ == "__main__":
    print(f"\n📁 Estrutura do projeto\n")
    print(ROOT.name)
    tree(ROOT)