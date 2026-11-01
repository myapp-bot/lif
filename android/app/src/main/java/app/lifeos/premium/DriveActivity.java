package app.lifeos.premium;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.TextView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.auth.api.identity.*;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

public class DriveActivity extends AppCompatActivity {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private String action;
    private boolean started=false;
    private final ActivityResultLauncher<IntentSenderRequest> resolution=registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(),r->{
        if(r.getResultCode()!=Activity.RESULT_OK){fail("Autorisation Google annulée.");return;}
        try{authorized(Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(r.getData()));}catch(Exception e){fail("Autorisation refusée : "+e.getMessage());}
    });
    @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);TextView v=new TextView(this);v.setText("Connexion sécurisée à Google Drive…");v.setGravity(Gravity.CENTER);v.setPadding(32,32,32,32);setContentView(v);action=getIntent().getStringExtra("action");if(state!=null){started=state.getBoolean("started");}if(started)return;started=true;
        if("disconnect".equals(action)){BackupWorker.configure(this,false);BackupStore.prefs(this).edit().putBoolean("drive",false).apply();Identity.getAuthorizationClient(this).revokeAccess(RevokeAccessRequest.builder().setScopes(Collections.singletonList(new Scope(DriveFiles.SCOPE))).build()).addOnSuccessListener(x->{BackupStore.status(this,"Déconnecté");ok();}).addOnFailureListener(e->fail("Envois arrêtés. Révocation Google non confirmée : "+e.getMessage()));return;}
        Identity.getAuthorizationClient(this).authorize(DriveFiles.request()).addOnSuccessListener(r->{if(r.hasResolution()){if(r.getPendingIntent()==null){fail("Autorisation Google indisponible");return;}resolution.launch(new IntentSenderRequest.Builder(r.getPendingIntent().getIntentSender()).build());}else authorized(r);}).addOnFailureListener(e->fail("Connexion Google impossible. Vérifie l’API Drive, le client OAuth Android et le SHA-1 de cet APK. Détail : "+e.getMessage()));
    }
    @Override public void onSaveInstanceState(Bundle out){out.putBoolean("started",started);super.onSaveInstanceState(out);}
    private void authorized(AuthorizationResult r){String token=r.getAccessToken();if(token==null){fail("Google n’a pas fourni d’autorisation Drive.");return;}BackupStore.prefs(this).edit().putBoolean("drive",true).apply();if("connect".equals(action)){BackupStore.status(this,"Connecté, aucune sauvegarde envoyée par cette action");ok();return;}
        io.execute(()->{try{if("backup".equals(action))DriveFiles.backup(this,token);else if("restore".equals(action))BackupStore.put(this,"restore",DriveFiles.restore(token));else if("sync".equals(action))DriveFiles.sync(this,token);else throw new IllegalArgumentException("Action inconnue");runOnUiThread(this::ok);}catch(Exception e){runOnUiThread(()->fail(e.getMessage()));}});
    }
    private void ok(){setResult(Activity.RESULT_OK,new Intent());finish();}
    private void fail(String text){BackupStore.status(this,text);setResult(Activity.RESULT_CANCELED,new Intent().putExtra("error",text));finish();}
}
