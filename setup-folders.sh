# ===========================================
# 1. CREATE PROJECT STRUCTURE SCRIPT
# ===========================================

#!/bin/bash
# File: setup-folders.sh
# Description: Creates the complete folder structure

echo "Creating Enterprise React folder structure..."

# Create main source directories
mkdir -p src/{assets,components,config,context,errorBoundary,features,hoc,hooks,i18n,layouts,locales,middlewares,pages,routes,services,store,styles,theme,tests,types,utils}

# Create subdirectories for better organization
mkdir -p src/assets/{images,icons,fonts}
mkdir -p src/components/{common,forms,navigation,layout}
mkdir -p src/config/{api,constants,environment}
mkdir -p src/features/{auth,dashboard,profile}
mkdir -p src/hooks/{api,ui,utilities}
mkdir -p src/layouts/{auth,main,admin}
mkdir -p src/locales/{en,es,fr}
mkdir -p src/pages/{auth,dashboard,settings}
mkdir -p src/routes/{guards,config}
mkdir -p src/services/{api,auth,storage}
mkdir -p src/store/{slices,middleware}
mkdir -p src/styles/{base,components,utilities}
mkdir -p src/tests/{utils,mocks,fixtures}
mkdir -p src/types/{api,components,store}
mkdir -p src/utils/{validation,formatting,helpers}

# Create placeholder files to preserve folder structure in Git
find src -type d -empty -exec touch {}/.gitkeep \;

echo "✅ Folder structure created successfully!"
