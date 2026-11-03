package app.lifeos.premium;
import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.tasks.Tasks;
import java.util.concurrent.TimeUnit;

public class BackupWorker extends Worker {
    public BackupWorker(@NonNull Context c,@NonNull WorkerParameters p){super(c,p);}
    public static void configure(Context c,boolean enabled){BackupStore.prefs(c).edit().putBoolean("auto",enabled).apply();WorkManager wm=WorkManager.getInstance(c);if(!enabled){wm.cancelUniqueWork("lifeos-drive-backup");return;}
        Constraints constraints=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build();
        PeriodicWorkRequest work=new PeriodicWorkRequest.Builder(BackupWorker.class,12,TimeUnit.HOURS).setConstraints(constraints).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,15,TimeUnit.MINUTES).build();
        wm.enqueueUniquePeriodicWork("lifeos-drive-backup",ExistingPeriodicWorkPolicy.UPDATE,work);
    }
    @NonNull @Override public Result doWork(){Context c=getApplicationContext();if(!BackupStore.prefs(c).getBoolean("auto",false)||!BackupStore.prefs(c).getBoolean("drive",false))return Result.success();
        try{AuthorizationResult r=Tasks.await(Identity.getAuthorizationClient(c).authorize(DriveFiles.request()),45,TimeUnit.SECONDS);if(r.hasResolution()||r.getAccessToken()==null){BackupStore.status(c,"Reconnexion Google nécessaire. Ouvre Données & sauvegardes.");return Result.failure();}if(isStopped()||!BackupStore.prefs(c).getBoolean("auto",false))return Result.success();DriveFiles.backup(c,r.getAccessToken());return Result.success();}
        catch(Exception e){BackupStore.status(c,"Envoi automatique différé : "+e.getMessage());return Result.retry();}
    }
}
