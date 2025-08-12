
# Quick shortcuts (optional)
PROJ=/Users/andrewbowers/Downloads/chambers_ui_starter

run-backend:
	bash $(PROJ)/scripts/mac_backend.sh

run-frontend:
	bash $(PROJ)/scripts/mac_frontend.sh

apply-mbox:
	@echo "Usage: make apply-mbox FILE=path/to/patch.mbox"; exit 1

apply-zip:
	@echo "Usage: make apply-zip DIR=path/to/unzipped_patch"; exit 1
