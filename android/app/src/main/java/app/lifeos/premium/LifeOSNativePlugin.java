package app.lifeos.premium;
import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import androidx.biometric.BiometricManager;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

@CapacitorPlugin(name="LifeOSNative")
public class LifeOSNativePlugin extends Plugin {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private MainActivity host(){return (MainActivity)getActivity();}
    private boolean allowed(PluginCall c){if(!host().isAccessAllowed()){c.reject("LifeOS est verrouillé.");return false;}return true;}
    @PluginMethod public void status(PluginCall c){var p=BackupStore.prefs(getContext());JSObject r=new JSObject();r.put("lockEnabled",p.getBoolean("lock",false));r.put("canAuthenticate",BiometricManager.from(getContext()).canAuthenticate(MainActivity.AUTH)==BiometricManager.BIOMETRIC_SUCCESS);r.put("driveConnected",p.getBoolean("drive",false));r.put("autoDrive",p.getBoolean("auto",false));r.put("lastCloudAt",p.getLong("lastCloudAt",0));r.put("cloudStatus",p.getString("cloudStatus","Aucune sauvegarde cloud"));c.resolve(r);}
    @PluginMethod public void setLock(PluginCall c){if(!allowed(c))return;boolean enabled=Boolean.TRUE.equals(c.getBoolean("enabled"));getActivity().runOnUiThread(()->host().authenticate(()->{BackupStore.prefs(getContext()).edit().putBoolean("lock",enabled).apply();c.resolve();},c::reject));}
    @PluginMethod public void lockNow(PluginCall c){if(!allowed(c))return;if(!host().lockEnabled()){c.reject("Active d’abord le verrouillage.");return;}getActivity().runOnUiThread(()->{host().lockNow();c.resolve();});}
    @PluginMethod public void stageSnapshot(PluginCall c){if(!allowed(c))return;String data=c.getString("data");io.execute(()->{try{new org.json.JSONObject(data);BackupStore.put(getContext(),"snapshot",data);c.resolve();}catch(Exception e){c.reject("Copie Android impossible : "+e.getMessage());}});}
    @PluginMethod public void exportFile(PluginCall c){if(!allowed(c))return;String data=c.getString("data"),name=c.getString("name","LifeOS-backup.json");if(data==null||data.length()>28_000_000){c.reject("Fichier invalide ou trop volumineux.");return;}Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^a-zA-Z0-9_.-]","_"));startActivityForResult(c,i,"exportResult");}
    @ActivityCallback private void exportResult(PluginCall c,ActivityResult r){if(c==null)return;if(r.getResultCode()!=Activity.RESULT_OK||r.getData()==null||r.getData().getData()==null){c.reject("Export annulé.");return;}io.execute(()->{try(OutputStream out=getContext().getContentResolver().openOutputStream(r.getData().getData(),"wt")){if(out==null)throw new IOException("Destination inaccessible");out.write(c.getString("data","").getBytes(StandardCharsets.UTF_8));c.resolve();}catch(Exception e){c.reject("Export impossible : "+e.getMessage());}});}
    @PluginMethod public void importFile(PluginCall c){if(!allowed(c))return;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});startActivityForResult(c,i,"importResult");}
    @ActivityCallback private void importResult(PluginCall c,ActivityResult r){if(c==null)return;if(r.getResultCode()!=Activity.RESULT_OK||r.getData()==null||r.getData().getData()==null){c.reject("Import annulé.");return;}io.execute(()->{try(InputStream in=getContext().getContentResolver().openInputStream(r.getData().getData())){JSObject out=new JSObject();out.put("data",DriveFiles.readLimited(in));c.resolve(out);}catch(Exception e){c.reject("Lecture impossible : "+e.getMessage());}});}
    @PluginMethod public void drive(PluginCall c){if(!allowed(c))return;String action=c.getString("action","");if(!java.util.Arrays.asList("connect","backup","restore","sync","disconnect").contains(action)){c.reject("Action inconnue");return;}Intent i=new Intent(getContext(),DriveActivity.class);i.putExtra("action",action);startActivityForResult(c,i,"driveResult");}
    @ActivityCallback private void driveResult(PluginCall c,ActivityResult r){if(c==null)return;Intent data=r.getData();if(r.getResultCode()!=Activity.RESULT_OK){c.reject(data==null?"Opération Google annulée":data.getStringExtra("error"));return;}if("restore".equals(c.getString("action"))||"sync".equals(c.getString("action"))){io.execute(()->{try{JSObject o=new JSObject();try{o.put("data",BackupStore.get(getContext(),"restore"));}catch(Exception noRemoteRestore){}BackupStore.prefs(getContext()).edit().remove("restore").apply();c.resolve(o);}catch(Exception e){c.reject(e.getMessage());}});}else c.resolve();}
    @PluginMethod public void setAutoBackup(PluginCall c){if(!allowed(c))return;boolean enabled=Boolean.TRUE.equals(c.getBoolean("enabled"));if(enabled&&!BackupStore.prefs(getContext()).getBoolean("drive",false)){c.reject("Connecte Google Drive d’abord.");return;}BackupWorker.configure(getContext(),enabled);c.resolve();}
}
