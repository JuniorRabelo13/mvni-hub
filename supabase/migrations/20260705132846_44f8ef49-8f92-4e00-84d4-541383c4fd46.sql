
-- mvno-faturas-operadora: apenas admin/master
CREATE POLICY "mvno_faturas_op_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'mvno-faturas-operadora' AND (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())))
WITH CHECK (bucket_id = 'mvno-faturas-operadora' AND (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())));

-- mvno-faturas-cliente: apenas admin/master (cliente acessa via signed URL gerada por edge)
CREATE POLICY "mvno_faturas_cli_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'mvno-faturas-cliente' AND (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())))
WITH CHECK (bucket_id = 'mvno-faturas-cliente' AND (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())));
