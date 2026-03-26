import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "confirm";
};

const ConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmLabel, variant = "destructive" }: ConfirmDialogProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${variant === "confirm" ? "bg-secondary/10" : "bg-destructive/10"}`}>
              <AlertTriangle size={20} className={variant === "confirm" ? "text-secondary" : "text-destructive"} />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button variant={variant === "confirm" ? "default" : "destructive"} size="sm" onClick={onConfirm}>{confirmLabel || "Eliminar"}</Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
